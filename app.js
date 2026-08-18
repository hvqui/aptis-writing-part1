let quizData = null;
let currentClub = null;
let timerInterval = null;
let secondsPassed = 0;

document.addEventListener("DOMContentLoaded", () => {
    fetch("data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Không thể tải file data.json");
            }
            return response.json();
        })
        .then(data => {
            quizData = data;
            initApp();
        })
        .catch(error => {
            console.error("Lỗi:", error);
            alert("Vui lòng sử dụng Local Web Server (như Live Server) để mở dự án hoặc đảm bảo file data.json tồn tại.");
        });
});

function initApp() {
    document.getElementById("appTitle").innerText = quizData.title;
    // document.getElementById("appPart").innerText = quizData.part;

    // Khởi tạo Dropdown lựa chọn Chủ đề (Club)
    const clubSelect = document.getElementById("clubSelect");
    clubSelect.innerHTML = "";

    quizData.clubs.forEach(club => {
        const option = document.createElement("option");
        option.value = club.id;
        option.innerText = club.name;
        clubSelect.appendChild(option);
    });

    // Mặc định chọn club đầu tiên
    currentClub = quizData.clubs[0];
    renderQuestions(currentClub);

    // Lắng nghe sự kiện đổi chủ đề từ dropdown -> Tự động reset bài
    clubSelect.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        currentClub = quizData.clubs.find(c => c.id === selectedId);
        resetAllState();
    });

    // Lắng nghe sự kiện các nút
    document.getElementById("checkBtn").addEventListener("click", checkAnswers);
    document.getElementById("resetTimerBtn").addEventListener("click", resetAllState);

    // Bắt đầu đồng hồ đếm giây
    startTimer();
}

// Bắt đầu hoặc tiếp tục đồng hồ
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsPassed++;
        updateTimerDisplay();
    }, 1000);
}

// Cập nhật hiển thị mm:ss
function updateTimerDisplay() {
    const mins = Math.floor(secondsPassed / 60).toString().padStart(2, '0');
    const secs = (secondsPassed % 60).toString().padStart(2, '0');
    document.getElementById("timer").innerText = `⏱️ Thời gian: ${mins}:${secs}`;
}

// Reset đồng hồ + Xóa sạch câu trả lời và kết quả về trạng thái ban đầu
function resetAllState() {
    // 1. Reset đồng hồ về 00:00
    secondsPassed = 0;
    updateTimerDisplay();
    startTimer();

    // 2. Render lại giao diện câu hỏi để xóa dữ liệu cũ
    if (currentClub) {
        renderQuestions(currentClub);
    }
}

// Hiển thị danh sách câu hỏi theo Club đang chọn
function renderQuestions(club) {
    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    club.questions.forEach(q => {
        const qBlock = document.createElement("div");
        qBlock.className = "question-block";
        qBlock.innerHTML = `
            <div class="question-title">${q.question}</div>
            <div class="translation">${q.translation}</div>
            <textarea id="q${q.id}" lang="en" spellcheck="true" placeholder="Type your answer in English..."></textarea>
            <div class="word-count" id="wc${q.id}">Số từ: 0</div>
            <div class="result-box" id="res${q.id}"></div>
        `;
        container.appendChild(qBlock);

        const textarea = qBlock.querySelector("textarea");
        textarea.addEventListener("input", () => updateWordCount(q.id));
    });
}

function updateWordCount(id) {
    const text = document.getElementById(`q${id}`).value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    document.getElementById(`wc${id}`).innerText = `Số từ: ${words}`;
}

function checkAnswers() {
    if (!currentClub) return;

    currentClub.questions.forEach(q => {
        const id = q.id;
        const inputElement = document.getElementById(`q${id}`);
        const resultBox = document.getElementById(`res${id}`);
        const userText = inputElement.value.trim();

        if (!userText) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div class="feedback warning">⚠️ Bạn chưa nhập câu trả lời.</div>
                <div class="sample-answer">💡 Đáp án mẫu: ${q.sampleAnswer}</div>
            `;
            return;
        }

        let warnings = [];

        // 1. Kiểm tra viết hoa đầu câu
        if (userText.charAt(0) !== userText.charAt(0).toUpperCase() && isNaN(userText.charAt(0))) {
            warnings.push("Nên viết hoa chữ cái đầu câu.");
        }

        // 2. Kiểm tra dấu chấm cuối câu
        if (!['.', '!', '?'].includes(userText.slice(-1))) {
            warnings.push("Nên có dấu chấm kết thúc câu.");
        }

        resultBox.style.display = 'block';
        let feedbackHtml = '';

        if (warnings.length === 0) {
            feedbackHtml = `<div class="feedback success">✔ Định dạng câu tốt! (Hãy chú ý các dấu gạch chân đỏ của trình duyệt nếu có từ viết sai chính tả).</div>`;
        } else {
            feedbackHtml = `<div class="feedback warning">⚠️ <strong>Góp ý định dạng:</strong><br>- ${warnings.join('<br>- ')}</div>`;
        }

        feedbackHtml += `<div class="sample-answer">💡 Đáp án mẫu: ${q.sampleAnswer}</div>`;
        resultBox.innerHTML = feedbackHtml;
    });
}