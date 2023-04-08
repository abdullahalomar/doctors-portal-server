const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { json } = require('express/lib/response');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qdof2wj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const serviceCollection = client.db('doctor_portal').collection('services');
        const bookingCollection = client.db('doctor_portal').collection('booking');

        app.get('/service', async(req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });


        app.get('/available', async(req, res)=> {
          const date = req.query.date;

          // step-1 : get all services
        const services = await serviceCollection.find().toArray();
        
        //step-2 : get the booking of that day
        const query = {date: date};
        const bookings = await bookingCollection.find(query).toArray();

        //step 3 : for each service, find booking for that service
        services.forEach(service => {
          const serviceBookings = bookings.filter(book => book.treatment === service.name);

          const bookedSlots = serviceBookings.map(book=> book.slot);

          const available = service.slots.filter(slot=> !bookedSlots.includes(slot));
          service.slots = available;
        })

        res.send(services);
        });
        

        /**
         * Api naming convention
         * app.get('/booking') // get all bookings
         * app.get('/booking/:id') // get single booking
         * app.post('booking') // add a new booking
         * app.patch('booking/:id') // update booking
         * app.delete('/booking') // delete booking
         */

        app.post('/booking', async(req, res)=> {
          const booking = req.body;
          const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient}
          const exists = await bookingCollection.findOne(query);
          if (exists) {
            return res.send({success: false, booking: exists})
          }
          const result = await bookingCollection.insertOne(booking);
          return res.send({success: true, result});
        })
    }
    finally{

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello doctor portal!')
})

app.listen(port, () => {
  console.log(`Doctors portal listening on port ${port}`)
})