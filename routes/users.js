const express=require('express')
const router=express.Router()


router.get("/",(req,res)=>{ 
    res.send("User List")
})
router.get('/new',(req,res)=>{
    res.send("User New Form")
})

router.get('/greet/:name',(req,res)=>{
    const name = req.params.name;
    res.send(`Hello, ${name}!`);
});

router.get('/bye/:name',(req,res)=>{
    const name=req.params.name;
    res.send(`Bye,${name}!`);
});

module.exports = router