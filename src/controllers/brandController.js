
const db = require('../models');
const Brand = db.Brand;

const getBrandAll = async(req , res)=>{
    try {
        const brand = await Brand.findAll();
        res.status(200).json({
            message:"get all Brands",
            brand,
        })
    }catch(e){
      res.status(500).json({
        message:"not fount brand ", error:e.message,
      })
    }
}

const getBrandById = async(req , res)=>{
    const {id} = req.params;
    try {
        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({
                message:"Brand not found",
            });
        }
        res.status(200).json(brand);
    }catch(e){
      res.status(500).json({
        message:"Error fetching brand", error:e.message,
      })
    }
}

const createBrand = async(req ,res)=>{
    try{
        const {name , image , status}= req.body;
        const newBrand = await Brand.create({name , image , status});

        res.status(200).json({
            newBrand,
            message:"Create Brands Successfully",
        })
    }catch(e){
        res.status(500).json({
            message:"not insert brand", error:e.message,
        })
    }
}

const updateBrand = async(req ,res)=>{
    const {id} = req.params;
    try{
        const {name , image , status}= req.body;
        const updatedBrand = await Brand.update(
            {name , image , status},
            {where:{id}}
        );
        res.status(200).json({
            updatedBrand,
            message:"Update Brand Successfully",
        })
    }catch(e){
        res.status(500).json({
            message:"not update brand", error:e.message,
        })
    }
}

const deleteBrand = async(req ,res)=>{
    const {id} = req.params;
    try{
        const deletedBrand = await Brand.destroy({where:{id}});
        res.status(200).json({
            deletedBrand,
            message:"Delete Brand Successfully",
        })
    }catch(e){
        res.status(500).json({
            message:"not delete brand", error:e.message,
        })
    }
}

module.exports = {
    getBrandAll,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
}