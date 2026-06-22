const http = require('http');

// Get sensor details from DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startSimulation() {
  console.log("Starting IoT Sensor Simulator...");
  
  // Create or get a test cage and sensors if none exist
  let cage = await prisma.cage.findFirst();
  if (!cage) {
    cage = await prisma.cage.create({ data: { name: "Тестовый Садок (IoT)", fishType: "Нерка" } });
    console.log("Created Test Cage");
  }

  // Create missing sensors
  const sensorTypes = ['TEMP', 'O2', 'PH'];
  for (const type of sensorTypes) {
    const existing = await prisma.sensor.findFirst({ where: { cageId: cage.id, type } });
    if (!existing) {
      await prisma.sensor.create({ data: { type, value: 0, cageId: cage.id } });
      console.log(`Created ${type} sensor`);
    }
  }

  const sensors = await prisma.sensor.findMany();
  console.log(`Loaded ${sensors.length} sensors from DB. Simulation running...`);

  // Simulate data every 3 seconds for fast demo
  setInterval(async () => {
    const sensors = await prisma.sensor.findMany();
    sensors.forEach(sensor => {
      let newValue = sensor.value || 0;
      if (sensor.type === 'TEMP') {
        newValue = 12 + (Math.random() - 0.5);
      } else if (sensor.type === 'O2') {
        newValue = 8.5 + (Math.random() - 0.5) * 0.4;
      } else if (sensor.type === 'PH') {
        newValue = 7.2 + (Math.random() - 0.5) * 0.2;
      }

      const postData = JSON.stringify({
        sensorId: sensor.id,
        token: sensor.secretToken,
        value: newValue.toFixed(2)
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/sensors/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
           process.stdout.write('.'); // Success tick
        } else {
           console.log(`\nError sending data for ${sensor.type}: ${res.statusCode}`);
        }
      });

      req.on('error', (e) => {
        console.error(`\nProblem with request: ${e.message}`);
      });

      req.write(postData);
      req.end();
    });
  }, 3000);
}

startSimulation().catch(console.error);
