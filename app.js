// ডামি ডেটা (ভবিষ্যতে এই ডেটা Gemini AI থেকে আসবে)
const timelineData = [
    {
        time: "10:00",
        period: "AM",
        subject: "উচ্চতর গণিত ১ম পত্র",
        topic: "ম্যাট্রিক্স ও নির্ণায়ক - লাইভ",
        status: "upcoming",
        // ইমোজির বদলে HTML স্প্যান আইকন
        buttonContent: `যুক্ত হোন <span class="material-symbols-rounded" style="font-size: 16px; margin-left: 4px;">play_arrow</span>`
    },
    {
        time: "03:00",
        period: "PM",
        subject: "রসায়ন ১ম পত্র",
        topic: "গুণগত রসায়ন-১ (উদ্ভাস পরীক্ষা)",
        status: "upcoming",
        buttonContent: `আসন <span class="material-symbols-rounded" style="font-size: 16px; margin-left: 4px;">hourglass_bottom</span>`
    },
    {
        time: "08:00",
        period: "PM",
        subject: "পদার্থবিজ্ঞান ১ম পত্র",
        topic: "ভেক্টর - ডট গুণন (MCQ টেস্ট)",
        status: "completed",
        buttonContent: `<span class="material-symbols-rounded" style="font-size: 16px; margin-right: 4px;">check_circle</span> সম্পন্ন`
    }
];

const timelineContainer = document.getElementById('timelineContainer');

function renderTimeline(data) {
    timelineContainer.innerHTML = ''; 

    data.forEach((item, index) => {
        // বাটনের কালার লজিক
        let btnClass = "bg-[#C57B5C] text-white";
        if (item.status === "completed") {
            btnClass = "bg-green-100 text-[#2ECC71]";
        } else if (item.buttonContent.includes("আসন")) {
            btnClass = "bg-gray-400 text-white";
        }

        const cardHTML = `
            <div class="flex gap-4 mb-4">
                <!-- Time & Line -->
                <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[#C57B5C] font-semibold text-sm">${item.time}</span>
                    <span class="text-[#C57B5C] font-semibold text-xs mb-2">${item.period}</span>
                    <div class="w-3 h-3 bg-[#C57B5C] rounded-full z-10 ring-4 ring-[#FDF8F5]"></div>
                    ${index !== data.length - 1 ? `<div class="w-0.5 h-full bg-gray-300 -mt-1"></div>` : `<div class="h-full"></div>`}
                </div>

                <!-- Content Card -->
                <div class="bg-white rounded-2xl shadow-sm p-4 w-full border border-gray-100">
                    <h4 class="text-[#C57B5C] text-xs font-semibold mb-1">${item.subject}</h4>
                    <h2 class="text-[#2D3748] text-[16px] font-bold mb-4">${item.topic}</h2>
                    
                    <div class="flex justify-end">
                        <button class="${btnClass} px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center justify-center">
                            ${item.buttonContent}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        timelineContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderTimeline(timelineData);
});

document.getElementById('uploadRoutineBtn').addEventListener('click', () => {
    alert("রুটিন আপলোডের কাজ এখানে হবে।");
});

document.getElementById('uploadExamBtn').addEventListener('click', () => {
    alert("খাতা আপলোডের কাজ এখানে হবে।");
});
