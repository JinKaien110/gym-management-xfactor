const fs = require('fs');
const data = JSON.parse(fs.readFileSync('seed-data.json', 'utf8'));

const firstNames = ['Alice','Emma','James','Maria','John','Sarah','Michael','Lisa','David','Jennifer','Robert','Mary','William','Patricia','Richard','Linda','Charles','Barbara','Thomas','Elizabeth','Christopher','Susan','Daniel','Jessica','Paul','Karen','Mark','Nancy','Donald','Betty','George','Helen','Kenneth','Sandra','Steven','Donna','Edward','Carol','Brian','Ruth'];
const lastNames = ['Anderson','Taylor','Martinez','Gonzalez','Wilson','Moore','Martin','Jackson','Thompson','White','Lopez','Lee','Gonzales','Harris','Clark','Lewis','Robinson','Walker','Perez','Hall','Young','Allen','Sanchez','Wright','King','Scott','Green','Baker','Adams','Nelson','Hill','Rivera','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans'];

// Expand clients to 30
const newClients = [];
for (let i = 0; i < 30; i++) {
    const fn = firstNames[i];
    const ln = lastNames[i];
    newClients.push({
        first_name: fn,
        last_name: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@6packironcity.com`,
        phone: `+639123456${(700 + i).toString().padStart(3,'0')}`,
        address: `${i+1} Street St, Metro Manila`,
        password: '123123123',
        gender: i % 2 === 0 ? 'female' : 'male',
        date_of_birth: `19${String(80 + (i % 30)).padStart(2,'0')}-01-15`,
        height: 150 + (i % 40),
        weight: 50 + (i % 40),
        bmi: Math.round((20 + (i % 10)) * 10) / 10,
        fitness_goal: ['weight_loss','muscle_gain','tone','strength','endurance'][i % 5],
        medical_condition: i % 3 !== 0 ? 'None' : 'Mild asthma',
        training_type: i % 2 === 0 ? 'group_class' : 'personal_training',
        experience_level: ['beginner','intermediate','advanced'][i % 3],
        days_per_week: [2,3,4,5][i % 4],
        session_minutes: [30,45,60][i % 3],
        emergency_name: `Emergency Contact ${i+1}`,
        emergency_contact: `+639987654${(300 + i).toString().padStart(3,'0')}`,
        emergency_relationship: ['spouse','parent','friend','sibling','guardian'][i % 5]
    });
}
data.clients = newClients;

// Expand trainers to 30
const specializations = [
    ['HIIT','Strength Training','Weight Loss'],
    ['Yoga','Pilates','Flexibility'],
    ['Boxing','Muay Thai','Cardio'],
    ['CrossFit','Functional Training'],
    ['Dance','Zumba','Aerobics'],
    ['Swimming','Water Aerobics'],
    ['Cycling','Spinning'],
    ['Martial Arts','Self Defense'],
    ['Senior Fitness','Rehabilitation'],
    ['Kids Fitness','Youth Training'],
    ['Powerlifting','Olympic Lifting'],
    ['Pilates','Barre'],
    ['Bootcamp','Circuit Training'],
    ['Running','Marathon Training'],
    ['Stretching','Mobility']
];
const newTrainers = [];
for (let i = 0; i < 30; i++) {
    const fn = firstNames[(i + 10) % firstNames.length];
    const ln = lastNames[(i + 15) % lastNames.length];
    const spec = specializations[i % specializations.length];
    newTrainers.push({
        first_name: fn,
        last_name: ln,
        email: `${fn.toLowerCase()}.trainer${i}@6packironcity.com`,
        phone: `+639123457${i.toString().padStart(3,'0')}`,
        specialization: spec,
        certification: `Certified ${spec[0]} Trainer Level ${Math.floor(i / 5) + 1}`,
        availability: {
            days: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].slice(0, (i % 5) + 2),
            time_from: `${String(6 + (i % 4)).padStart(2,'0')}:00`,
            time_to: `${String(18 + (i % 4)).padStart(2,'0')}:00`
        },
        rate: 400 + (i * 40),
        max_hours: 6 + (i % 5)
    });
}
data.trainers = newTrainers;

fs.writeFileSync('seed-data.json', JSON.stringify(data, null, 2));
console.log('Updated: ' + newClients.length + ' clients, ' + newTrainers.length + ' trainers');