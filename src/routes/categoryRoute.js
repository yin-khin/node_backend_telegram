
var{
    getCategory ,
    getOne,
    createCategory,
    updateCategory,
    deleteCategory,


} = require("../controllers/categoryController");
const auth = require("../middlewares/auth.middleware");
const category = (app)=>{
    app.get("/api/category",auth.validate_token(),getCategory);
    app.get("/api/category/:id",auth.validate_token(),getOne);
    app.post("/api/category",auth.validate_token(),createCategory);
    app.put("/api/category/:id", auth.validate_token(),updateCategory);
    app.delete("/api/category/:id", auth.validate_token(),deleteCategory);
}
module.exports = category;