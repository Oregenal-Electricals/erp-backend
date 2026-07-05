const axios = require('axios');
const BASE = 'http://localhost:3001/api/v1';
async function run() {
  const login = await axios.post(BASE+'/auth/login', {email:'admin@acmeelectronics.com',password:'Admin@1234'});
  const token = login.data.accessToken;
  const h = {Authorization:'Bearer '+token};

  // Get admin user id from token
  const me = await axios.get(BASE+'/auth/me', {headers:h});
  console.log('Admin userId:', me.data.id);

  // Get employees
  const emps = await axios.get(BASE+'/employees?limit=2', {headers:h});
  const emp1 = emps.data.data[0];
  console.log('Linking', emp1.employeeNumber, 'to admin user');

  // Link admin user to emp1
  const upd = await axios.put(BASE+'/employees/'+emp1.id, {userId: me.data.id}, {headers:h});
  console.log('OK Linked:', upd.data.employeeNumber, 'userId='+upd.data.userId);
}
run().catch(e=>console.log('ERR:', e.response?.data?.message || e.message));
