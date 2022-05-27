const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, MongoRuntimeError } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.57bag.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
      const serviceCollection = client.db('doctors_portal').collection('services');
      const bookingCollection = client.db('doctors_portal').collection('bookings');

      app.get('/service', async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      });
      
      // available
      app.get('/available', async (req, res) => {
        const date = req.query.date;
     console.log(date);
        // step 1 : get all services
        const services = await serviceCollection.find().toArray();

        // step 2: get booking of the day
        const query = { date: date };
        const bookings = await bookingCollection.find(query).toArray();

        // step 3: for each service, find booking for that service
        services.forEach(service => {
          const serviceBookings = bookings.filter(book => book.treatment === service.name);
          const bookedSlots = serviceBookings.map(book => book.slot);
          const available = service.slots.filter(slot => !bookedSlots.includes(slot));
          service.slots = available;
        });
         console.log(services);
        res.send(services);
      });

      // booking for dashboard
      app.post('/booking', async (req, res) => {
        const patient = req.query.patient;
        const query = { patient: patient };
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
      });
      
      // booking
      app.post('/booking', async (req, res) => {
        const booking = req.body;
        const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
        const exists = await bookingCollection.findOne(query);
        if (exists) {
          return res.send({ success: false, booking: exists })
        }
        const result = await bookingCollection.insertOne(booking);
        res.send({ success: true, result });
      });

    }
    finally {
        
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Doctors Portal!!')
})

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`)
})