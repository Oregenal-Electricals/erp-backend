const axios = require('axios');
const BASE = 'http://localhost:3001/api/v1';
async function run() {
  const login = await axios.post(BASE+'/auth/login', {email:'admin@acmeelectronics.com',password:'Admin@1234'});
  const token = login.data.accessToken;
  const h = {Authorization:'Bearer '+token};

  const emps = await axios.get(BASE+'/employees?limit=2', {headers:h});
  const empIds = emps.data.data.map(e=>e.id);

  const sessions = await axios.get(BASE+'/training/sessions', {headers:h});
  const session = sessions.data.data[0];
  console.log('Session:', session.sessionNumber, 'enrollments='+session._count.enrollments);

  // Enroll (may already exist)
  try {
    const enroll = await axios.post(BASE+'/training/enroll', {sessionId:session.id, employeeIds:empIds}, {headers:h});
    console.log('OK Enroll:', JSON.stringify(enroll.data.results));
  } catch(e) { console.log('Enroll:', e.response?.data?.message||e.message); }

  // Detail
  const detail = await axios.get(BASE+'/training/sessions/'+session.id, {headers:h});
  console.log('OK Enrollments:', detail.data.enrollments.length);

  if (detail.data.enrollments.length > 0) {
    // Mark attendance
    const attRecords = detail.data.enrollments.map(e=>({enrollmentId:e.id,attended:true}));
    const att = await axios.post(BASE+'/training/sessions/'+session.id+'/attendance', {records:attRecords}, {headers:h});
    console.log('OK Attendance:', att.data.results.length, 'marked');

    // Complete first enrollment
    const comp = await axios.put(BASE+'/training/enrollments/'+detail.data.enrollments[0].id+'/complete', {score:85,passed:true,remarks:'Excellent'}, {headers:h});
    console.log('OK Complete:', comp.data.status, 'cert='+comp.data.certificateNumber, 'score='+comp.data.score);
  }

  // Stats
  const stats = await axios.get(BASE+'/training/stats', {headers:h});
  console.log('OK Stats:', JSON.stringify(stats.data));

  // Emp history
  const hist = await axios.get(BASE+'/training/employee/'+empIds[0], {headers:h});
  console.log('OK Emp History:', hist.data.length, 'trainings');
}
run().catch(e => console.log('ERR:', e.response?.data||e.message));
