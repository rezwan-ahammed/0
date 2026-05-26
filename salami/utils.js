

import { AI_API_KEY, AI_MODEL, BAD_WORDS } from './config.js';

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

export const verifyWithAI = async (combinedBase64, taskDesc) => {
    if (!AI_API_KEY) return { isSamePerson: true, isTaskCompleted: true, reason: "এআই পুলিশ ঘুমাচ্ছে!" };
    
    // আপডেটেড এবং স্মার্ট প্রম্পট ইঞ্জিনিয়ারিং
    const prompt = `You are a funny, sarcastic, but extremely fair and LENIENT Bengali AI guard evaluating an Eid Salami request.
    The image contains 3 photos side-by-side. 
    Left: Gallery photo. Middle: Live hidden selfie. Right: User performing a task.
    
    Assigned Task: "${taskDesc}". 
    
    Evaluate based on these rules:
    1. Are the persons in all 3 photos the EXACT same individual? (Be reasonably confident).
    2. Is the person in the Right-most photo performing the Assigned Task? 
       *CRITICAL RULE*: Be VERY LENIENT. If the user makes ANY visible effort to do the task, consider it a pass (true). 
       For example, if the task asks for an "extreme grimace/ভেংচি", just sticking the tongue out, closing one eye, or making ANY silly face MUST be accepted as true. Do NOT demand perfection or extreme acting. If they did anything related to the task, "isTaskCompleted" MUST be true.
       
    Return ONLY a valid JSON object without any markdown formatting: 
    {
        "isSamePerson": boolean, 
        "isTaskCompleted": boolean, 
        "reason": "If false, scold them in funny satirical Bengali. If true, praise them sarcastically in Bengali (e.g., 'তোর ভেংচি দেখে তো কাকও ভয় পাবে, যাই হোক পাস করেছিস!' or 'যাক, বান্দরের মতো হলেও অন্তত চেষ্টা তো করেছিস, ভেরিফাইড!')."
    }`;

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: combinedBase64 } }
                        ]
                    }
                ],
                response_format: { type: "json_object" } 
            })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) { 
        return { isSamePerson: true, isTaskCompleted: true, reason: "সার্ভার বিজি! ফাঁকি দিসনাই আশা করি।" }; 
    }
};

export const checkProfanity = (text) => {
    if (!text) return false;
    return BAD_WORDS.some(word => text.toLowerCase().includes(word));
};
