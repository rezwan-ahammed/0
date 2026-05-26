import { GEMINI_API_KEY } from './config.js';

export const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300; 
                let scaleSize = MAX_WIDTH / img.width;
                if (scaleSize > 1) scaleSize = 1; 
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6)); 
            };
        };
    });
};

export const createCollage = async (b1, b2, b3) => {
    const loadImg = (src) => new Promise(res => { let i = new Image(); i.onload = () => res(i); i.src = src; });
    const [i1, i2, i3] = await Promise.all([loadImg(b1), loadImg(b2), loadImg(b3)]);
    const canvas = document.createElement('canvas');
    const w = 300; 
    canvas.width = w * 3;
    const h1 = i1.height * (w/i1.width);
    const h2 = i2.height * (w/i2.width);
    const h3 = i3.height * (w/i3.width);
    canvas.height = Math.max(h1, h2, h3);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(i1, 0, 0, w, h1);
    ctx.drawImage(i2, w, 0, w, h2);
    ctx.drawImage(i3, w*2, 0, w, h3);
    return canvas.toDataURL('image/jpeg', 0.6); 
};

export const verifyWithGemini = async (combinedBase64, taskDesc) => {
    if (!GEMINI_API_KEY) return { isSamePerson: true, isTaskCompleted: true, reason: "এআই পুলিশ ঘুমাচ্ছে!" };
    const base64Data = combinedBase64.split(',')[1];
    const prompt = `This image contains 3 photos side-by-side. Left: Gallery photo. Middle: Live selfie (Captured in background). Right: User performing a task.
    Assigned Task: "${taskDesc}". Analyze deeply and act as a strict, sarcastic Bengali AI guard:
    1. Are the persons in all 3 photos EXACTLY the same individual?
    2. Is the person in the Right-most photo ACTUALLY doing the assigned task?
    Return ONLY a valid JSON: {"isSamePerson": boolean, "isTaskCompleted": boolean, "reason": "If false, scold them in funny satirical Bengali. If true, praise them."}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (error) { return { isSamePerson: true, isTaskCompleted: true, reason: "সার্ভার বিজি!" }; }
};

const badWords = ['শালা', 'বাল', 'মাগি', 'খানকি', 'চুদ', 'চুদা', 'কুত্তা', 'শুয়োর', 'বেশ্যা', 'হালারপো', 'fuck', 'bitch', 'asshole', 'bastard'];
export const checkProfanity = (text) => {
    if (!text) return false;
    return badWords.some(word => text.toLowerCase().includes(word));
};
