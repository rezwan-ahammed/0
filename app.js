import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDML6tbSONWaW8-5_SfaIC63MtVk4Oq_Xs",
    authDomain: "general-57884.firebaseapp.com",
    databaseURL: "https://general-57884-default-rtdb.firebaseio.com",
    projectId: "general-57884",
    storageBucket: "general-57884.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// OpenRouter Config
const OPENROUTER_API_KEY = "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";
const MODEL_NAME = "google/gemini-1.5-flash"; // Multimodal support on OpenRouter

// DOM Elements
const timelineContainer = document.getElementById('timelineContainer');
const aiLoading = document.getElementById('aiLoading');
const loadingText = document.getElementById('loadingText');

// Dialog Elements
const customDialog = document.getElementById('customDialog');
const dialogIcon = document.getElementById('dialogIcon');
const dialogTitle = document.getElementById('dialogTitle');
const dialogMessage = document.getElementById('dialogMessage');
const closeDialogBtn = document.getElementById('closeDialogBtn');

// Custom Dialog Controller
function showDialog(title, message, isError = true) {
    dialogTitle.innerText = title;
    // Object বা JSON আসলে যেন সুন্দরভাবে দেখায়
    dialogMessage.innerText = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    
    if (isError) {
        dialogIcon.innerText = 'error';
        dialogIcon.className = 'material-symbols-rounded text-5xl text-red-500';
        dialogTitle.className = 'text-xl font-bold text-red-500';
    } else {
        dialogIcon.innerText = 'check_circle';
        dialogIcon.className = 'material-symbols-rounded text-5xl text-[#2ECC71]';
        dialogTitle.className = 'text-xl font-bold text-[#2ECC71]';
    }
    
    customDialog.classList.remove('hidden');
}

closeDialogBtn.addEventListener('click', () => {
    customDialog.classList.add('hidden');
});

// UI Render Logic
function renderTimeline(data) {
    timelineContainer.innerHTML = ''; 
    if(!data || data.length === 0) {
        timelineContainer.innerHTML = '<p class="text-gray-400 text-center mt-5 bg-white p-4 rounded-xl border border-dashed">কোনো রুটিন পাওয়া যায়নি।</p>';
        return;
    }

    data.forEach((item, index) => {
        let btnClass = "bg-[#C57B5C] text-white";
        if (item.status === "completed") btnClass = "bg-green-100 text-[#2ECC71]";
        else if (item.buttonContent.includes("আসন")) btnClass = "bg-gray-400 text-white";

        const cardHTML = `
            <div class="flex gap-4 mb-4 relative z-0">
                <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[#C57B5C] font-bold text-sm">${item.time}</span>
                    <span class="text-[#C57B5C] font-semibold text-[10px] mb-2">${item.period}</span>
                    <div class="w-3 h-3 bg-[#C57B5C] rounded-full z-10 ring-4 ring-[#FDF8F5]"></div>
                    ${index !== data.length - 1 ? `<div class="w-[2px] h-full bg-[#E2E8F0] -mt-1"></div>` : `<div class="h-full"></div>`}
                </div>
                <div class="bg-white rounded-2xl shadow-sm p-4 w-full border border-gray-100 hover:shadow-md transition">
                    <h4 class="text-[#C57B5C] text-[11px] font-bold mb-1 uppercase tracking-wider">${item.subject}</h4>
                    <h2 class="text-[#2D3748] text-[15px] font-bold mb-4 leading-tight">${item.topic}</h2>
                    <div class="flex justify-end">
                        <button class="${btnClass} px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center justify-center gap-1 transition-transform active:scale-95">
                            ${item.buttonContent}
                        </button>
                    </div>
                </div>
            </div>`;
        timelineContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Fetch Firebase Data
const routinesRef = ref(db, 'user_routines');
onValue(routinesRef, (snapshot) => {
    const data = snapshot.val();
    if(data) {
        renderTimeline(Object.values(data));
    } else {
        renderTimeline([]);
    }
});

// File to Base64 (Full Data URI needed for OpenRouter)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // Returns "data:image/jpeg;base64,..."
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// OpenRouter API Call Function
async function callOpenRouter(base64Image, prompt) {
    const url = "https://openrouter.ai/api/v1/chat/completions";
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href, 
            "X-Title": "Admission Dashboard"
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ]
        })
    });

    const result = await response.json();

    // API Level Error Handling
    if (!response.ok) {
        throw new Error(JSON.stringify(result.error, null, 2) || `HTTP Error ${response.status}`);
    }

    if (!result.choices || result.choices.length === 0) {
        throw new Error("এআই কোনো রেসপন্স জেনারেট করতে পারেনি।\nResponse: " + JSON.stringify(result));
    }

    return result.choices[0].message.content;
}

// Routine Upload Event
document.getElementById('uploadRoutineBtn').addEventListener('click', () => {
    document.getElementById('routineInput').click();
});

document.getElementById('routineInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    aiLoading.classList.remove('hidden');
    loadingText.innerText = "রুটিন থেকে ডেটা বের করা হচ্ছে...";

    try {
        const base64ImageUri = await fileToBase64(file);
        
        const prompt = `
            Analyze this routine image. Extract the upcoming classes or exams.
            Return ONLY a valid JSON array matching exactly this format. Do not wrap in markdown like \`\`\`json. Just the raw array:
            [
              {
                "time": "10:00",
                "period": "AM",
                "subject": "বিষয়",
                "topic": "টপিকের নাম",
                "status": "upcoming",
                "buttonContent": "যুক্ত হোন <span class='material-symbols-rounded' style='font-size: 16px;'>play_arrow</span>"
              }
            ]
        `;

        const aiResponseText = await callOpenRouter(base64ImageUri, prompt);
        
        // JSON Parsing Error Handling
        let extractedData;
        try {
            const cleanJson = aiResponseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            extractedData = JSON.parse(cleanJson);
        } catch (jsonError) {
            throw new Error(`এআই সঠিক JSON ফরম্যাটে ডেটা দেয়নি।\n\nAI এর আউটপুট ছিল:\n${aiResponseText}`);
        }

        // Save to Firebase
        extractedData.forEach(item => {
            const newRoutineRef = push(routinesRef);
            set(newRoutineRef, item);
        });

        showDialog("সফল!", "রুটিন সফলভাবে সেভ হয়েছে এবং টাইমলাইনে যুক্ত হয়েছে।", false);
        e.target.value = ''; 
    } catch (error) {
        console.error("System Error:", error);
        showDialog("এআই প্রসেসিং এরর", error.message, true);
    } finally {
        aiLoading.classList.add('hidden');
    }
});

// Exam Analysis Event
document.getElementById('uploadExamBtn').addEventListener('click', () => {
    document.getElementById('examInput').click();
});

document.getElementById('examInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    aiLoading.classList.remove('hidden');
    loadingText.innerText = "খাতা স্ক্যান করা হচ্ছে...";

    try {
        const base64ImageUri = await fileToBase64(file);
        const prompt = "This is an exam paper. Briefly analyze the mistakes in Bengali and explain the correct answer.";
        
        const feedback = await callOpenRouter(base64ImageUri, prompt);
        
        showDialog("খাতা অ্যানালাইসিস সম্পন্ন", feedback, false);
        e.target.value = '';
    } catch(error) {
        console.error("System Error:", error);
        showDialog("অ্যানালাইসিস এরর", error.message, true);
    } finally {
        aiLoading.classList.add('hidden');
    }
});
