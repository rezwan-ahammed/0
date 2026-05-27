import { auth, db, appId } from './config.js';
import { compressImage, createCollage, verifyWithAI, checkProfanity } from './utils.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, setDoc, getDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion;
const Confetti = window.ReactConfetti;

const App = () => {
    const [user, setUser] = useState(null);
    const [appState, setAppState] = useState('loading'); 

    useEffect(() => {
        const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) {} };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if(u) {
                try {
                    const blDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blacklist', u.uid));
                    if(blDoc.exists()) { setAppState('blacklisted'); return; }

                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'salami_requests', u.uid);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) { setAppState('already_submitted'); } 
                    else { setAppState('greeting'); }
                } catch (e) { setAppState('greeting'); }
            }
        });
        return () => unsubscribe();
    }, []);

    if (appState === 'loading') return <div className="min-h-screen flex items-center justify-center"><i className="ph ph-spinner-gap animate-spin text-5xl text-brand"></i></div>;
    if (appState === 'already_submitted') return <AlreadySubmittedView />;
    if (appState === 'blacklisted') return <BlacklistedView />;
    if (appState === 'greeting') return <InteractiveGreeting onComplete={() => setAppState('form')} />;
    return <SalamiForm user={user} onSuccess={() => setAppState('already_submitted')} onBlocked={() => setAppState('blacklisted')} />;
};

const AlreadySubmittedView = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-center max-w-sm w-full border border-gray-100">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><i className="ph-fill ph-check-circle text-5xl"></i></div>
            <h2 className="text-2xl font-bold text-dark mb-2">রিকোয়েস্ট জমা আছে!</h2>
            <p className="text-muted mb-4">আপনি ইতিমধ্যে একটি সালামি রিকোয়েস্ট পাঠিয়েছেন বা আপনার তথ্যের সাথে অন্য কারো তথ্যের মিল পাওয়া গেছে।</p>
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">অ্যাডমিন চেক করে টাকা পাঠিয়ে দেবেন ইনশাআল্লাহ!</p>
        </div>
    </div>
);

const BlacklistedView = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(239,68,68,0.15)] text-center max-w-sm w-full border border-red-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><i className="ph-fill ph-warning-octagon text-5xl"></i></div>
            <h2 className="text-2xl font-black text-red-700 mb-2">আপনি ব্লকড! 🚫</h2>
            <p className="text-red-600/80 mb-4 font-medium text-sm">আপত্তিকর শব্দ বা গালি ব্যবহার করার কারণে আপনাকে ব্লাকলিস্ট করা হয়েছে!</p>
        </div>
    </div>
);

const InteractiveGreeting = ({ onComplete }) => {
    const [step, setStep] = useState(0); 
    const handleInteraction = () => {
        if (step === 0) {
            setStep(1); setTimeout(() => setStep(2), 3500); setTimeout(() => onComplete(), 4000);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-colors duration-1000" style={{ backgroundColor: step === 0 ? '#1a100c' : '#FFF5ED' }} onClick={handleInteraction}>
            {step === 1 && Confetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} colors={['#D37D45', '#F59E0B', '#10B981']} />}
            <AnimatePresence>
                {step === 0 && (
                    <motion.div key="moon" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 2 }} className="text-center">
                        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                            <i className="ph-fill ph-moon-stars text-8xl text-amber-300 drop-shadow-[0_0_20px_rgba(252,211,77,0.8)]"></i>
                        </motion.div>
                        <p className="mt-8 text-lg font-light tracking-widest text-amber-100 uppercase opacity-70 animate-pulse">চাঁদ দেখতে ট্যাপ করুন</p>
                    </motion.div>
                )}
                {step === 1 && (
                    <motion.div key="greeting" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -100 }} className="text-center px-4">
                        <h1 className="text-6xl font-black text-brand mb-4 font-[Aref_Ruqaa]">ঈদ মোবারক</h1>
                        <p className="text-xl text-dark font-medium leading-relaxed">ঈদের এই আনন্দময় দিনে আপনার জন্য রইলো <br/> অনেক ভালোবাসা।</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SalamiForm = ({ user, onSuccess, onBlocked }) => {
    const [formData, setFormData] = useState({ name: '', fbLink: '', gender: '', rezwanOpinion: '', amount: '', paymentMethod: 'bkash', accountNumber: '', message: '' });
    const [photos, setPhotos] = useState({ p1: null, p2: null }); 
    const [bgPhoto, setBgPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingState, setLoadingState] = useState(''); 
    const [aiRejection, setAiRejection] = useState(null);
    const [toastMsg, setToastMsg] = useState('');
    const [scoldMessage, setScoldMessage] = useState('');
    const [taskData, setTaskData] = useState(null);
    
    // নতুন লজিক: ক্যামেরা সাপোর্ট ও এরর স্ট্যাটাস
    const [cameraError, setCameraError] = useState(null);

    useEffect(() => {
        // ইন-অ্যাপ ব্রাউজার বা ক্যামেরা সাপোর্ট চেক
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('unsupported');
            return;
        }

        let stream;
        navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
            stream = s;
            const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = stream;
            video.play().then(() => {
                setToastMsg("নিরাপত্তার স্বার্থে আপনার একটি লাইভ ছবি ব্যাকগ্রাউন্ডে তোলা হচ্ছে...");
                setTimeout(() => {
                    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 240;
                    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
                    setBgPhoto(canvas.toDataURL('image/jpeg'));
                    stream.getTracks().forEach(t => t.stop());
                    setTimeout(() => setToastMsg(''), 4000); 
                }, 2500);
            });
        }).catch(e => { 
            // যদি ইউজার পারমিশন ডিনাই করে
            setCameraError('denied'); 
        });

        return () => { if(stream) stream.getTracks().forEach(t => t.stop()); }
    }, []);

    useEffect(() => {
        const amt = parseInt(formData.amount);
        const gender = formData.gender;
        setScoldMessage(''); setTaskData(null); setAiRejection(null);

        if (isNaN(amt) || amt <= 0 || !gender) return;

        if (amt > 50) {
            const boyScolds = ["কিরে খনিকের পোলা! তোর বাপে কি আমারে এটিএম মেশিন দিয়ে গেছে? যা 'ফ্যামিলি কার্ড' নিয়ে টিসিবির লাইনে দাঁড়া!", "ওরে খাম্বার পোলা! এতো টাকা দিয়ে কী করবি? 'ফুয়েল কার্ড' নিয়ে পাম্পে গিয়ে শুয়ে থাক!", "বেদ্দপ কোথাকার! তুই কি জারেক টিয়ার গাড়ির পিছনের চাটু রানার? 'কৃষক কার্ড' নিয়ে মাঠে গিয়ে ঘাস কাট!", "কিরে মানিকের নাতি! তুই তো দেখি শিলং সা.উ.আ-র সাংবিধানিক সন্তান! বেগুনের বদলে পেঁপে দিয়ে বেগুনি বানা!"];
            const girlScolds = ["আপু, আপনার দাবিকৃত অ্যামাউন্টটি একটু বেশি হয়ে গেছে। দয়া করে আরেকটু কম অ্যামাউন্ট সিলেক্ট করুন!", "প্রিয় আপু, সালামির একটা সুন্দর লিমিট থাকে। এতো বেশি টাকা তো দেওয়া সম্ভব না। একটু কমিয়ে বলুন!", "সম্মানিত আপু, আপনার চাওয়াটা অনেক বড়! আমাদের বাজেট তো এতো না। দয়া করে অ্যামাউন্টটা কমান।", "আপু, এতো টাকা দিয়ে কী করবেন? সালামির পরিমাণটা একটু কমিয়ে দিন, আমরা খুশি হয়ে দিয়ে দেবো!"];
            setScoldMessage((gender === 'boy' ? boyScolds : girlScolds)[Math.floor(Math.random() * 4)]);
        } else {
            if (amt >= 1 && amt <= 10) { setTaskData({ title: "ভিখারি রেঞ্জ!", task: "ফকিন্নির মতো একটা করুণ মুখ করে ছবি দে!", icon: "ph-coins" }); }
            else if (amt >= 11 && amt <= 20) { setTaskData({ title: "চা-বিস্কুট রেঞ্জ!", task: gender === 'boy' ? "চরম লেভেলের ভেংচি কাটা ছবি দে!" : "ঠোঁট গোল করে পাউট (Pout) করা সেলফি দে!", icon: "ph-coffee" }); }
            else if (amt >= 21 && amt <= 30) { setTaskData({ title: "স্মার্ট রেঞ্জ!", task: gender === 'boy' ? "চোখে রোদচশমা দিয়ে, আঙ্গুল দিয়ে 'V' সাইন করে পোজ দে!" : "দুই গালে হাত দিয়ে কিউট হাসির ছবি দে!", icon: "ph-sunglasses" }); }
            else if (amt >= 31 && amt <= 40) { setTaskData({ title: "উন্নয়ন রেঞ্জ!", task: gender === 'boy' ? "লুঙ্গি বা প্যান্ট মালকোঁচা মারা পাওয়ারফুল এটিচিউডের ছবি দে!" : "শাড়ি বা সুন্দর ড্রেস পরে ভাবমারা এটিচিউডের ছবি দে!", icon: "ph-trend-up" }); }
            else if (amt >= 41 && amt <= 50) { setTaskData({ title: "ভিআইপি ডিমান্ড!", task: gender === 'boy' ? "কান ধরে মুরগি হয়ে বসে থাকার ছবি দে!" : "দুই হাতে সুন্দর করে মেহেদী দিয়ে সেই মেহেদী রাঙা হাতের ছবি দে!", icon: "ph-warning-octagon" }); }
        }
    }, [formData.amount, formData.gender]);

    const handlePhoto = async (e, key) => {
        const file = e.target.files[0];
        if (file) { const compressed = await compressImage(file); setPhotos(prev => ({...prev, [key]: compressed})); setAiRejection(null); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (scoldMessage || !taskData) return alert("অ্যামাউন্ট ঠিক নেই!");
        if (!photos.p1 || !photos.p2) return alert("সবগুলো ছবি আপলোড করতে হবে!");
        if (!bgPhoto) return alert("আপনার লাইভ ক্যামেরা পারমিশন দেওয়া হয়নি। পেজটি রিফ্রেশ করে ক্যামেরার এক্সেস দিন!");
        
        const isAbusive = checkProfanity(formData.name) || checkProfanity(formData.rezwanOpinion) || checkProfanity(formData.message);
        if (isAbusive) {
            setLoading(true); setLoadingState('blocking');
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blacklist', user.uid), { uid: user.uid, fbLink: formData.fbLink, accountNumber: formData.accountNumber, name: formData.name, reason: 'Abusive language', createdAt: serverTimestamp() });
            setLoading(false); onBlocked(); return;
        }

        setLoading(true);
        try {
            setLoadingState('checking_db');
            const reqRef = collection(db, 'artifacts', appId, 'public', 'data', 'salami_requests');
            const blRef = collection(db, 'artifacts', appId, 'public', 'data', 'blacklist');
            const [blFb, blAcc, reqFb, reqAcc] = await Promise.all([
                getDocs(query(blRef, where("fbLink", "==", formData.fbLink))), getDocs(query(blRef, where("accountNumber", "==", formData.accountNumber))),
                getDocs(query(reqRef, where("fbLink", "==", formData.fbLink))), getDocs(query(reqRef, where("accountNumber", "==", formData.accountNumber)))
            ]);

            if (!blFb.empty || !blAcc.empty) { setLoading(false); onBlocked(); return; }
            if (!reqFb.empty || !reqAcc.empty) { setLoading(false); onSuccess(); return; }

            setLoadingState('combining');
            const combinedBase64 = await createCollage(photos.p1, bgPhoto, photos.p2);
            
            setLoadingState('ai_checking');
            const aiResult = await verifyWithAI(combinedBase64, taskData.task);
            
            if (!aiResult.isSamePerson || !aiResult.isTaskCompleted) { setAiRejection(aiResult.reason); setLoading(false); return; }

            setLoadingState('saving');
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'salami_requests', user.uid), {
                ...formData, demandedAmount: parseInt(formData.amount), taskCompleted: taskData.task, photoCombined: combinedBase64, aiReason: aiResult.reason, createdAt: serverTimestamp(), senderUid: user.uid, status: 'pending'
            });
            onSuccess(); 
        } catch (error) { alert("সমস্যা হয়েছে! আবার চেষ্টা করুন।"); } finally { setLoading(false); }
    };

    // যদি ক্যামেরা এরর থাকে তবে ফর্ম লোড না করে ওয়ার্নিং দেখাবে
    if (cameraError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(239,68,68,0.15)] text-center max-w-sm w-full border border-red-200">
                    <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="ph-fill ph-camera-slash text-5xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-red-700 mb-3">ক্যামেরা অ্যাক্সেস নেই!</h2>
                    {cameraError === 'unsupported' ? (
                        <p className="text-red-600/90 mb-4 font-medium text-sm leading-relaxed">
                            এখানে পোর্টালটি লোড করা সম্ভব নয়। সম্ভবত আপনি ফেসবুক বা মেসেঞ্জারের ভেতরের ব্রাউজার ব্যবহার করছেন যেখানে ক্যামেরা সাপোর্ট নেই। <br/><br/>
                            <span className="font-bold text-red-800 bg-red-100 px-2 py-1 rounded block mt-2 border border-red-200">দয়া করে উপরে 3-dots এ ক্লিক করে "Open in Chrome/Safari" তে গিয়ে পোর্টালটি ওপেন করুন।</span>
                        </p>
                    ) : (
                        <p className="text-red-600/90 mb-4 font-medium text-sm leading-relaxed">
                            আপনি ক্যামেরা পারমিশন ব্লক করেছেন! <br/><br/>
                            <span className="font-bold text-red-800 bg-red-100 px-2 py-1 rounded block mt-2 border border-red-200">সালামি রিকোয়েস্ট করতে চাইলে ব্রাউজারের সেটিংসে গিয়ে ক্যামেরা পারমিশন দিন এবং পেজটি রিফ্রেশ করুন।</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const isSubmitDisabled = loading || !!scoldMessage || !taskData || !photos.p1 || !photos.p2 || !formData.fbLink || !formData.name || !formData.rezwanOpinion || !bgPhoto;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen max-w-md mx-auto relative pb-10">
            <AnimatePresence>
                {toastMsg && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 text-sm font-medium w-[90%] max-w-sm">
                        <i className="ph-fill ph-camera text-brand text-lg animate-pulse"></i> <span className="flex-1 text-center">{toastMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center p-5 pt-12">
                <div><h1 className="text-2xl font-bold text-dark leading-tight">সালামি পোর্টাল</h1><p className="text-muted text-sm">এআই পুলিশ পাহারা দিচ্ছে! 🕵️‍♂️</p></div>
                <div className="w-12 h-12 bg-white text-brand rounded-full flex items-center justify-center shadow-md"><i className="ph-fill ph-robot text-2xl"></i></div>
            </div>

            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white px-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 relative">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-brand rounded-full"></motion.div>
                            <i className="ph-fill ph-robot text-5xl text-brand"></i>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">এআই ভেরিফিকেশন চলছে...</h3>
                        <p className="text-center text-gray-300">
                            {loadingState === 'blocking' && 'ডেটা প্রসেস হচ্ছে...'}
                            {loadingState === 'checking_db' && 'ডুপ্লিকেট রিকোয়েস্ট চেক করা হচ্ছে...'}
                            {loadingState === 'combining' && 'আপনার ছবিগুলো প্রসেস করা হচ্ছে...'}
                            {loadingState === 'ai_checking' && 'এআই চেক করছে...'}
                            {loadingState === 'saving' && 'ভেরিফাইড! ডাটাবেসে সেভ হচ্ছে...'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setFormData({...formData, gender: 'boy'})} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 border-2 ${formData.gender === 'boy' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-[#F8F9FA] border-transparent text-muted'}`}><i className="ph-fill ph-gender-male text-lg"></i> ছেলে</button>
                            <button type="button" onClick={() => setFormData({...formData, gender: 'girl'})} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 border-2 ${formData.gender === 'girl' ? 'bg-pink-50 border-pink-400 text-pink-600' : 'bg-[#F8F9FA] border-transparent text-muted'}`}><i className="ph-fill ph-gender-female text-lg"></i> মেয়ে</button>
                        </div>
                        <input type="text" required placeholder="আপনার নাম লিখুন" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border-transparent focus:border-brand/30 outline-none text-dark" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input type="url" required placeholder="ফেসবুক লিংক" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border-transparent focus:border-brand/30 outline-none text-dark font-mono text-sm" value={formData.fbLink} onChange={e => setFormData({...formData, fbLink: e.target.value})} />
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <label className="block text-xs font-bold text-blue-800 mb-2">রেজওয়ান সম্পর্কে আপনার মতামত কী? *</label>
                            <textarea required rows="2" placeholder="মতামত লিখুন..." className="w-full px-4 py-3 rounded-lg bg-white border border-blue-200 outline-none resize-none" value={formData.rezwanOpinion} onChange={e => setFormData({...formData, rezwanOpinion: e.target.value})}></textarea>
                        </div>
                        <div className="flex items-center relative">
                            <input type="number" required placeholder="কত টাকা সালামি চান?" min="1" className="w-full pl-4 pr-12 py-4 rounded-xl font-bold text-xl outline-none border-2 bg-[#F8F9FA] border-transparent text-brand focus:border-brand/30" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                            <span className="absolute right-4 font-bold text-gray-400">৳</span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {scoldMessage && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className={`${formData.gender === 'girl' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'} border-2 rounded-3xl p-5 text-center mt-4`}>
                                    <h3 className="font-bold text-lg">অসম্ভব দাবি!</h3><p className="text-sm font-medium mt-1">"{scoldMessage}"</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {taskData && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-gradient-to-br from-brand to-[#E08A55] rounded-3xl p-1 shadow-lg mt-4">
                                <div className="bg-white rounded-[22px] p-5">
                                    <h3 className="font-bold text-dark text-lg flex items-center gap-2 mb-3"><i className={`ph-fill ${taskData.icon} text-brand`}></i> {taskData.title}</h3>
                                    <div className="bg-orange-50 p-4 rounded-xl mb-5"><p className="text-dark font-medium text-sm">টাস্ক: {taskData.task}</p></div>
                                    
                                    {aiRejection && (
                                        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg mb-5">
                                            <p className="text-red-800 font-bold text-sm">এআই ভেরিফিকেশন ফেইল্ড!</p>
                                            <p className="text-red-700 text-xs italic mt-1">"{aiRejection}"</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-gray-300 bg-[#F8F9FA] cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">{photos.p1 ? <img src={photos.p1} className="w-full h-full object-cover"/> : <i className="ph-fill ph-image"></i>}</div>
                                                <div><p className="text-xs font-bold">১. গ্যালারি থেকে ছবি</p></div>
                                            </div>
                                            <input type="file" accept="image/*" onChange={(e)=>handlePhoto(e, 'p1')} className="hidden" />
                                        </label>
                                        <label className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-gray-300 bg-[#F8F9FA] cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">{photos.p2 ? <img src={photos.p2} className="w-full h-full object-cover"/> : <i className="ph-fill ph-camera"></i>}</div>
                                                <div><p className="text-xs font-bold text-brand">২. টাস্ক কমপ্লিট ছবি</p></div>
                                            </div>
                                            <input type="file" accept="image/*" capture="user" onChange={(e)=>handlePhoto(e, 'p2')} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {taskData && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 mt-4">
                            <textarea rows="2" placeholder="আবেগী মেসেজ (ঐচ্ছিক)" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-sm resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                            
                            <div className="flex gap-2">
                                {[{id: 'bkash', label: 'বিকাশ', c: '#E2136E'}, {id: 'nagad', label: 'নগদ', c: '#ED1C24'}, {id: 'rocket', label: 'রকেট', c: '#8C15A6'}].map(m => (
                                    <button key={m.id} type="button" onClick={() => setFormData({...formData, paymentMethod: m.id})} className={`flex-1 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-1.5 border-2 ${formData.paymentMethod === m.id ? 'bg-white border-brand' : 'bg-[#F8F9FA] border-transparent'}`}>
                                        {formData.paymentMethod === m.id && <div className="w-2 h-2 rounded-full" style={{backgroundColor: m.c}}></div>}{m.label}
                                    </button>
                                ))}
                            </div>
                            <input type="tel" required placeholder="অ্যাকাউন্ট নম্বর (017...)" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none font-bold font-mono tracking-wider text-lg" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
                            
                            <button type="submit" disabled={isSubmitDisabled} className={`w-full text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 text-lg ${isSubmitDisabled ? 'bg-gray-300 opacity-50' : 'bg-brand'}`}>
                                <i className="ph-bold ph-robot text-xl"></i> এআই ভেরিফাই করে সাবমিট করুন
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </motion.div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
