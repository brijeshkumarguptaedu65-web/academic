const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const runTest = async () => {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Register Admin
        console.log('\n[1] Registering Admin...');
        let adminToken;
        try {
            const adminRes = await axios.post(`${API_URL}/auth/admin/register`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            adminToken = adminRes.data.token;
            console.log('Admin Registered:', adminRes.data.email);
        } catch (e) {
            // If already exists, login
            const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            adminToken = loginRes.data.token;
            console.log('Admin Logged In');
        }

        const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };

        // 2. Setup Data (Classes, Subjects, Topics)
        console.log('\n[2] Setting up Meta Data...');

        // Create Class 3 and 4
        // Check if exists first or just create (ignoring error)
        let class3, class4;
        try {
            const c3 = await axios.post(`${API_URL}/admin/classes`, { name: 'Class 3', level: 3 }, adminAuth);
            class3 = c3.data;
        } catch (e) {
            const classes = await axios.get(`${API_URL}/admin/classes`, adminAuth);
            class3 = classes.data.find(c => c.level === 3);
        }

        try {
            const c4 = await axios.post(`${API_URL}/admin/classes`, { name: 'Class 4', level: 4 }, adminAuth);
            class4 = c4.data;
        } catch (e) {
            const classes = await axios.get(`${API_URL}/admin/classes`, adminAuth);
            class4 = classes.data.find(c => c.level === 4);
        }
        console.log('Classes Ready:', class3.name, class4.name);

        // Subject
        let subject;
        try {
            const s = await axios.post(`${API_URL}/admin/subjects`, { name: 'Mathematics' }, adminAuth);
            subject = s.data;
        } catch (e) {
            const subjects = await axios.get(`${API_URL}/admin/subjects`, adminAuth);
            subject = subjects.data.find(s => s.name === 'Mathematics');
        }
        console.log('Subject Ready:', subject.name);

        // Topic
        let topic;
        try {
            const t = await axios.post(`${API_URL}/admin/topics`, { name: 'Geometry' }, adminAuth);
            topic = t.data;
        } catch (e) {
            const topics = await axios.get(`${API_URL}/admin/topics`, adminAuth);
            topic = topics.data.find(t => t.name === 'Geometry');
        }
        console.log('Topic Ready:', topic.name);

        // 3. Create Chapters (The Fallback Chain)
        console.log('\n[3] Creating Chapters...');
        // Class 3 Geometry
        const ch3Res = await axios.post(`${API_URL}/admin/chapters`, {
            classId: class3._id,
            subjectId: subject._id,
            chapterName: 'Basics of Shapes',
            topicName: topic.name,
            instructions: { totalQuestions: 10, timeLimitMinutes: 10, passingMarks: 5 }
        }, adminAuth);

        // Class 4 Geometry
        const ch4Res = await axios.post(`${API_URL}/admin/chapters`, {
            classId: class4._id,
            subjectId: subject._id,
            chapterName: 'Advanced Shapes',
            topicName: topic.name,
            instructions: { totalQuestions: 10, timeLimitMinutes: 10, passingMarks: 5 }
        }, adminAuth);
        console.log('Chapters Created:', ch3Res.data.chapterName, ch4Res.data.chapterName);

        // 4. Student Flow
        console.log('\n[4] Student Flow...');
        // Login Student (Class 4)
        const studentRes = await axios.post(`${API_URL}/auth/student/login`, {
            username: 'student_test',
            class: 4
        });
        const studentToken = studentRes.data.token;
        const studentAuth = { headers: { Authorization: `Bearer ${studentToken}` } };
        console.log('Student Logged In');

        // Submit Quiz for Class 4 Chapter (FAIL to trigger fallback)
        console.log('\n[5] Taking Quiz (Simulating FAIL)...');
        const quizRes = await axios.post(`${API_URL}/student/quiz/submit`, {
            quizId: 'test_quiz_id',
            chapterId: ch4Res.data._id,
            answers: [] // Empty answers, score will be mock 8? Wait, code hardcoded 8, total 15.
            // 8/15 = 53% -> Fail (<60%).
            // Let's rely on hardcoded mock in controller to Fail.
        }, studentAuth);

        console.log('Quiz Result:', quizRes.data.result);
        console.log('Feedback Message:', quizRes.data.feedback.message);
        console.log('Fallback Action:', quizRes.data.feedback.fallbackAction);

        if (quizRes.data.feedback.recommendedChapter) {
            console.log('Recommended Remedial Chapter:', quizRes.data.feedback.recommendedChapter.chapterName);
            console.log('Recommended Class Level:', quizRes.data.feedback.recommendedChapter.classLevel);

            if (quizRes.data.feedback.recommendedChapter.chapterName === 'Basics of Shapes') {
                console.log('SUCCESS: Fallback logic correctly identified Class 3 chapter.');
            } else {
                console.log('FAILURE: Incorrect fallback chapter.');
            }
        } else {
            console.log('FAILURE: No fallback chapter recommended.');
        }

    } catch (err) {
        console.error('ERROR:', err.response ? err.response.data : err.message);
    }
};

runTest();
