const fs = require('fs');
(()=>{
    const reservations = JSON.parse(fs.readFileSync('edis/reservations.json'));
    

    const fixed = []
    for(const reservation of reservations){
        if(reservation.service === "Vse"){
            fixed.push(reservation);
        }
    }

    fs.writeFileSync('edis/vsereservations.json', JSON.stringify(fixed, null, 2));

}

)()