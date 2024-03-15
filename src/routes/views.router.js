import { Router } from "express";
import ProductManager from '../ProductManager.js';

const viewsRouter = Router();
const PM = new ProductManager();

// Show All Products
viewsRouter.get('/', async (req, res) => {
    let products = await PM.getProducts();
    res.render(
        "home",
        {
            products: products,
            style: "index.css"
        }
    );
});

// Show All Products with Websockets
viewsRouter.get('/realtimeproducts', async (req, res) => {
    let products = await PM.getProducts();
    res.render(
        "realTimeProducts",
        {
            products: products,
            style: "realTimeProducts.css"
        }
    );
});

export default viewsRouter;