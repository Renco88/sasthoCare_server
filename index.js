const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vxd2usv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const expertscollection = client.db("sasthocareDB").collection("experts");
        const favscollection = client.db("sasthocareDB").collection("favs");
        const appointmentsCollection = client.db("sasthocareDB").collection("appointments");


        // ✅ POST new expert
        app.post('/experts', async (req, res) => {
            try {
                const expert = req.body;
                if (!expert?.email || !expert?.name || !expert?.category || !expert?.role) {
                    return res.status(400).json({ message: 'Missing required expert fields.' });
                }

                const existing = await expertscollection.findOne({ email: expert.email });
                if (existing) {
                    return res.status(409).json({ message: 'Expert with this email already exists.' });
                }

                const result = await expertscollection.insertOne(expert);
                res.status(201).json({ message: 'Expert saved successfully!', insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ message: 'Server error' });
            }
        });

        app.get('/experts/:email', async (req, res) => {
            try {
                const emailParam = req.params.email;

                // Case-insensitive regex search for email
                const expert = await expertscollection.findOne({ email: { $regex: `^${emailParam}$`, $options: "i" } });

                if (!expert) {
                    return res.status(404).json({ message: 'Expert not found' });
                }

                res.json(expert);
            } catch (error) {
                console.error('Error fetching expert by email:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });



        app.get('/experts', async (req, res) => {
            try {
              
                res.json(experts);
            } catch (error) {
                console.error('Error fetching experts:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });





        // ✅ Add a new appointment
        app.post('/appointments', async (req, res) => {
            try {
                const appointment = req.body;

                if (!appointment.name || !appointment.date || !appointment.status) {
                    return res.status(400).json({ message: 'Missing required appointment fields.' });
                }

                appointment.createdAt = new Date();
                const result = await appointmentsCollection.insertOne(appointment);
                res.status(201).json({ message: 'Appointment saved successfully!', insertedId: result.insertedId });
            } catch (error) {
                console.error('Error saving appointment:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });

        // ✅ Get all appointments
        app.get('/appointments', async (req, res) => {
            try {
                const appointments = await appointmentsCollection.find({}).toArray();
                res.json(appointments);
            } catch (error) {
                console.error('Error fetching appointments:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });

        // ✅ Get appointments for a specific user (by email)
        app.get('/appointments/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const appointments = await appointmentsCollection.find({ userEmail: email }).toArray();
                res.json(appointments);
            } catch (error) {
                console.error('Error fetching user appointments:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });


        // Node.js + Express backend
        app.get('/favs', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const result = await favscollection.find(query).toArray();
            res.send(result);
        });


        app.post('/favs', async (req, res) => {
            const favoExpart = req.body;
            const result = await favscollection.insertOne(favoExpart);
            res.send(result);
        });






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to the API!');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});