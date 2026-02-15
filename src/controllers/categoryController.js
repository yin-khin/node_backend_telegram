const db = require('../models');
const Category = db.Category;

const getCategory = async (req , res)=>{

    try{
        const category = await Category.findAll(); 
        res.status(200).json({
            category,
            message:"get all category"
        })
    }catch(e){
        res.status(500).json({
             message: 'Error fetching customers', error: e.message
        })
    }


}

const getOne = async(req , res )=>{
    const {id} = req.params;
    try{
        const category = await Category.findByPk(id);
        res.status(200).json({
            category,
            message:" Category not found" 
        })
    }catch(e){
        res.status(500).json({
            message:"not fount category ",error:e.message
        })
    }
}

const createCategory = async (req , res)=>{
    try{
        const {name ,image, status}  = req.body;
        const newCategory = await Category.create({name, image, status});
        res.status(201).json({
            newCategory ,
            message:"Category created successfully",
        });
    }catch(e){
      res.status(500).json({
        message:"Error creating customer", e: e.message,
      })
    }
}

const updateCategory = async(req, res)=>{
    const {id} = req.params;
    const {name , image,status} = req.body;

    try{
        const category = await Category.findByPk(id);
        await category.update({name,image , status});
        res.status(200).json({
            category,
            message:"update category successfully",
        })
    }catch(e){
        res.status(500).json({
            message:"Error not update category " , error:e.message,
        })
    }
}
const deleteCategory = async(req, res )=>{
    const {id}=req.params;

    try{
        const category = await Category.findByPk(id);
        await category.destroy();
        res.status(200).json({
            category,
            message:"Delete category successfully",
        })
    }catch(e){
        res.status(500).json({
            message:"delete not fount", error:e.message,
        })
    }
}

module.exports = {
    getCategory,
    getOne,
    createCategory,
    updateCategory,
    deleteCategory,
}