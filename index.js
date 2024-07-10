const express= require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require('cors');
const bodyParser = require('body-parser');

const app= express();
const uri = "mongodb+srv://user:user191@cluster0.ao1wc6e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const client = new MongoClient(uri,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

const STARTSERVER=async()=>{
    try{
        await client.connect();
        console.log("Connected successfully to MongoDB");
        initEndpoints();
        app.listen(3000,()=>{
            console.log("Server is running on port 3000");
        })
    }
    catch(error){
        console.log("Unable to Connect to Database",error.stack);
        process.exit(1);
    }
}

STARTSERVER();

const initEndpoints=async()=>{
    // ************ENDPOINT FOR LOGIN VALIDATION************
    app.post('/accounts', async(req,res)=>{
        try{
            const accounts= client.db('TravelBudDatabase').collection('Accounts');
            const {name,password}= req.body;
            const existingAccount = await accounts.findOne({name});
            if(existingAccount){
                if(existingAccount.password === password){
                    res.status(200).json({message:'Logged in Successfully'});
                }
                else{
                    res.status(500).send({message:'Incorrect Password'});
                }
            }
            else{
                await accounts.insertOne({name,password});
                res.status(200).json({message:'Account Created Successfully'});
            }
        }
    
        catch(error){
            console.log('Error Creating Account :', error);
            res.status(500).json({message:'Internal Server Error. Try Again Later'});
        }
    })

    // ************ENDPOINT FOR EDITING ACCOUNT DETAILS************
    app.put('/editaccount',async(req,res)=>{
        try{
          const accounts= client.db('TravelBudDatabase').collection('Accounts');
          const { name, password, newName } = req.body;
          const user = await accounts.findOne({ name, password });
          if (!user) {
            return res.status(404).json({ message: 'Incorrect password' });
        }
        const result = await accounts.updateOne(
            { name, password },
            { $set: { name: newName } }
        );
        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Username updated successfully' });
        } else {
            res.status(500).json({ message: 'Failed to update username' });
        }

        }
        catch(error){
            console.log('Error updating user account:', error);
            res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }
        
    })

    // ************ENDPOINT FOR ROUTE CREATION************
    app.post('/createroute',async(req,res)=>{
        try{
          const routes= client.db('TravelBudDatabase').collection('RoutesData');
          const{id,poster,routeName,routeDate,routeNote}=req.body;
          const existingRoute= await routes.findOne({routeName});
          if (existingRoute) {
            return res.status(400).json({ message: 'Route already exists' });
        }

        const newRoute = {
            id,
            poster,
            routeName,
            routeDate,
            routeNote,
            participants: [],
            comments: []
        };

        await routes.insertOne(newRoute);
        res.status(200).json({ message: 'Route Scheduled Successfully' });
    } catch (error) {
        console.log('Error Creating Route:', error);
        res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
    }
    })

    // ************ENDPOINT FOR ADDING PARTICIPANTS************
    app.put('/addparticipant',async (req,res)=>{
        try{
            const routes= client.db('TravelBudDatabase').collection('RoutesData');
            const {name,contribution,id}=req.body;
            const result = await routes.updateOne(
                { id: id },
                { $push: { participants: { name, contribution } } }
            );

            res.status(200).json({ message: 'Participant added successfully' });
        }
        catch(error){
        console.log('Error Adding Participant:', error);
        res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }
    })

    // ************ENDPOINT FOR ADDING COMMENTS************
    app.put('/addcomment',async (req,res)=>{
        try{
            const routes= client.db('TravelBudDatabase').collection('RoutesData');
            const {name,body,id}=req.body;
            const result = await routes.updateOne(
                { id: id },
                { $push: { comments: { name,body } } }
            );

            res.status(200).json({ message: 'Comment added successfully' });
        }
        catch(error){
        console.log('Error Adding Comment:', error);
        res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }
    })

        // ************ENDPOINT FOR SENDING ROUTE NAMES************
    app.get('/getroutenames',async(req,res)=>{
        try{
        const routesCollection = client.db('TravelBudDatabase').collection('RoutesData');
        const routeNames = await routesCollection.find({}, { projection: { routeName: 1, id: 1,_id: 0 } }).toArray();
         res.status(200).json(routeNames);
        }
        catch(error){
            console.log('Error Fetching Route Names:', error);
            res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }  
    })

    // ************ENDPOINT FOR SENDING ROUTE DATA************
    app.get('/getroutedata',async(req,res)=>{
        try{
            const routesCollection = client.db('TravelBudDatabase').collection('RoutesData');
            const { routeId } = req.query;
            const routeData = await routesCollection.findOne({ id: routeId });

            if (!routeData) {
                return res.status(404).json({ message: 'Route not found' });
            }
    
            res.status(200).json(routeData);
        }
        catch(error){
            console.log('Error Fetching Route Data:', error);
            res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }
    })

    // ************ENDPOINT FOR SENDING ROUTE PARTICIPANTS************
    app.get('/getrouteparticipants',async(req,res)=>{
        try{
            const routesCollection = client.db('TravelBudDatabase').collection('RoutesData');
            const { routeId } = req.query;
            const participantsData = await routesCollection.findOne({ id: routeId }, { projection: { participants: 1 } });
            if (!participantsData) {
                return res.status(404).json({ message: 'Route not found' });
            }
    
            res.status(200).json(participantsData);
        }
        catch(error){
            console.log('Error Fetching Particpants:', error);
            res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }
    })

     // ************ENDPOINT FOR SENDING ROUTE COMMENTS************
     app.get('/getroutecomments',async(req,res)=>{
        try{
            const routesCollection = client.db('TravelBudDatabase').collection('RoutesData');
            const { routeId } = req.query;
            const commentsData = await routesCollection.findOne({ id: routeId }, { projection: { comments: 1 } });
            if (!commentsData) {
                return res.status(404).json({ message: 'Route not found' });
            }
    
            res.status(200).json(commentsData);
        }
        catch(error){
            console.log('Error Fetching Comments:', error);
            res.status(500).json({ message: 'Internal Server Error. Try Again Later' });
        }
    })

   }
