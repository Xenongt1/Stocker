const axios = require('axios');

async function testAPI() {
    try {
        console.log('Testing API health endpoint...');
        const healthResponse = await axios.get('http://localhost:5001/api/health');
        console.log('Health check response:', healthResponse.data);

        console.log('\nTesting login endpoint...');
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        console.log('Login successful:', loginResponse.data);
        
        const token = loginResponse.data.token;
        console.log('\nTesting protected endpoint with token...');
        const userResponse = await axios.get('http://localhost:5001/api/auth/me', {
            headers: {
                'x-auth-token': token
            }
        });
        
        console.log('User data:', userResponse.data);
        
    } catch (error) {
        console.error('API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

testAPI(); 