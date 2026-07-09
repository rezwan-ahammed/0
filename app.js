import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDML6tbSONWaW8-5_SfaIC63MtVk4Oq_Xs",
    authDomain: "general-57884.firebaseapp.com",
    databaseURL: "https://general-57884-default-rtdb.firebaseio.com",
    projectId: "general-57884",
    storageBucket: "general-57884.firebasestorage.app",
    messagingSenderId: "5002724584",
    appId: "1:5002724584:web:YOUR_WEB_APP_ID" // Web app id না থাকলে এটা ইগনোর করলেও কাজ করতে পারে
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const GEMINI_API_KEY = "AQ.Ab8RN6LzF0wBhS-StnT3jlXKaK7T4kPyBL6lLyCglI4b_40RBw";
// আপনার দেওয়া সঠিক মডেল নেম
const GEMINI_MODEL = "gemini-flash-lite-latest"; 

const timelineContainer = document.getElementById('timelineContainer');
const aiLoading = document.getElementById('aiLoading');
const loadingText = document.getElementById('loadingText');

function renderTimeline(data) {
    timelineContainer.innerHTML = ''; 
    if(!data || data.length === 0) {
        timelineContainer.innerHTML = '<p class="text-gray-400 text-center mt-5">কোনো রুটিন পাওয়া যায়নি।</p>';
        return;
    }

    data.forEach((item, index) => {
        let btnClass = "bg-[#C57B5C] text-white";
        if (item.status === "completed") btnClass = "bg-green-100 text-[#2ECC71]";
        else if (item.buttonContent.includes("আসন")) btnClass = "bg-gray-400 text-white";

        const cardHTML = `
            <div class="flex gap-4 mb-4">
                <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[#C57B5C] font-semibold text-sm">${item.time}</span>
                    <span class="text-[#C57B5C] font-semibold text-xs mb-2">${item.period}</span>
                    <div class="w-3 h-3 bg-[#C57B5C] rounded-full z-10 ring-4 ring-[#FDF8F5]"></div>
                    ${index !== data.length - 1 ? `<div class="w-0.5 h-full bg-gray-300 -mt-1"></div>` : `<div class="h-full"></div>`}
                </div>
                <div class="bg-white rounded-2xl shadow-sm p-4 w-full border border-gray-100">
                    <h4 class="text-[#C57B5C] text-xs font-semibold mb-1">${item.subject}</h4>
                    <h2 class="text-[#2D3748] text-[16px] font-bold mb-4">${item.topic}</h2>
                    <div class="flex justify-end">
                        <button class="${btnClass} px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center justify-center">
                            ${item.buttonContent}
                        </button>
                    </div>
                </div>
            </div>`;
        timelineContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

const routinesRef = ref(db, 'user_routines');
onValue(routinesRef, (snapshot) => {
    const data = snapshot.val();
    if(data) {
        const routineArray = Object.values(data);
        renderTimeline(routineArray);
    } else {
        renderTimeline([]);
    }
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function callGemini(base64Image, mimeType, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const base64Data = base64Image.split(',')[1];

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
            }]
        })
    });

    const result = await response.json();
    
    // API থেকে কোনো এরর আসলে তা ক্যাচ করা
    if (!response.ok) {
        console.error("API Error Response:", result);
        throw new Error(result.error?.message || "API Fetch Failed");
    }

    // AI যদি কোনো টেক্সট না দেয়
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("AI কোনো উত্তর দিতে পারেনি।");
    }

    return result.candidates[0].content.parts[0].text;
}

document.getElementById('uploadRoutineBtn').addEventListener('click', () => {
    document.getElementById('routineInput').click();
});

document.getElementById('routineInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    aiLoading.classList.remove('hidden');
    loadingText.innerText = "রুটিন থেকে ডেটা বের করা হচ্ছে...";

    try {
        const base64 = await fileToBase64(file);
        
        const prompt = `
            Analyze this routine image. Extract the upcoming classes or exams.
            Return ONLY a valid JSON array matching exactly this format (no markdown, no extra text):
            [
              {
                "time": "10:00",
                "period": "AM",
                "subject": "বিষয়",
                "topic": "টপিকের নাম",
                "status": "upcoming",
                "buttonContent": "যুক্ত হোন <span class='material-symbols-rounded' style='font-size: 16px; margin-left: 4px;'>play_arrow</span>"
              }
            ]
        `;

        const aiResponseText = await callGemini(base64, file.type, prompt);
        
        // JSON পরিষ্কার করা
        const jsonText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const extractedData = JSON.parse(jsonText);

        // Firebase এ সেভ করা
        extractedData.forEach(item => {
            const newRoutineRef = push(routinesRef);
            set(newRoutineRef, item);
        });

        alert("রুটিন সফলভাবে সেভ হয়েছে!");
        e.target.value = ''; // ইনপুট ক্লিয়ার করা
    } catch (error) {
        console.error("Error details:", error);
        // এখন অ্যালার্টে ঠিক কী কারণে ফেইল করেছে তা দেখাবে
        alert("এরর: " + error.message);
    } finally {
        aiLoading.classList.add('hidden');
    }
});

// খাতা অ্যানালাইসিস (আগের মতোই)
document.getElementById('uploadExamBtn').addEventListener('click', () => {
    document.getElementById('examInput').click();
});

document.getElementById('examInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    aiLoading.classList.remove('hidden');
    loadingText.innerText = "খাতা স্ক্যান করে ভুল ধরা হচ্ছে...";

    try {
        const base64 = await fileToBase64(file);
        const prompt = "This is a student's exam paper. Tell me briefly what are the mistakes in Bengali language.";
        const feedback = await callGemini(base64, file.type, prompt);
        
        alert("এআই ফিডব্যাক:\n\n" + feedback);
        e.target.value = '';
    } catch(error) {
        console.error("Error details:", error);
        alert("এরর: " + error.message);
    } finally {
        aiLoading.classList.add('hidden');
    }
});
