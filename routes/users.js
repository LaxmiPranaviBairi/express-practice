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

router.get('/search',(req,res)=>{
    const {term,limit} = req.query;
    res.json({searchedFor: term, limit: limit});
});

const products=[
    {id: 1,name: 'Laptop',price: 50000},
    {id: 2,name: 'Phone',price: 20000},
    {id: 3,name:'Headphones',price: 2000},
];

router.get('/products/:id',(req,res)=>{
   const id=Number(req.params.id);
   const product=products.find(p=>p.id===id);

   if(!product){
    return res.status(404).json({message:'Product not found'});
   }
   res.json(product);
});

module.exports = router