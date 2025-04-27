
import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export default async function handler(req, res) {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        res.status(200).json({ message: "Successfully connected to MongoDB!" });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        res.status(500).json({ message: "Failed to connect to MongoDB" });

    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
