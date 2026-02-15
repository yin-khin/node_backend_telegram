
var {
    getBrandAll,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
}= require("../controllers/brandController");
const auth = require("../middlewares/auth.middleware");
const Brand = (app)=>{
    app.get("/api/brands", auth.validate_token(),getBrandAll);
    app.get("/api/brands/:id", auth.validate_token(),getBrandById);
    app.post("/api/brands",auth.validate_token(),createBrand);
    app.put("/api/brands/:id",auth.validate_token(),updateBrand);
    app.delete("/api/brands/:id",auth.validate_token(),deleteBrand);
}

module.exports = Brand;