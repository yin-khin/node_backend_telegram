

var { getPurchaseItem, createPurchaseItem, updatePurchaseItem, deletePurchaseItem, getById }=require("../controllers/PurchaseItemController");
const auth = require("../middlewares/auth.middleware")
const purchaseItem = (app)=>{
    app.get("/api/purchaseItem",auth.validate_token(),getPurchaseItem);
    app.get("/api/purchaseItem/:id",auth.validate_token(),getById);
    app.post("/api/purchaseItem",auth.validate_token(),createPurchaseItem);
    app.put("/api/purchaseItem/:id",auth.validate_token(),updatePurchaseItem);
    app.delete("/api/purchaseItem/:id",auth.validate_token(),deletePurchaseItem);
}

module.exports=purchaseItem;
