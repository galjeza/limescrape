const fs = require('fs');
(()=>{
        const appointments = JSON.parse(fs.readFileSync('output/appointments.json'));
        // send a requset to the server for each appointment
        for (const appointment of appointments) {
            // create a new object with the data from the appointment
            const appointmentData = {
                "date": appointment.date,
                "time": appointment.time,
                "service": appointment.service,
                "customer": {
                    "fullName": appointment.fullName,
                    "phone": appointment.phone,
                    "email": appointment.email
                }
            };
            // send a request to the server
            const response = await fetch('http://localhost:3000/appointments', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(appointmentData)
             });
             const responseData = await response.json();
             console.log(responseData);
        }
        
    }
    


)()