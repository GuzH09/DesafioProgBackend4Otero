import { Router } from "express";
import CartManager from '../CartManager.js';
import ProductManager from '../ProductManager.js';

const cartsRouter = Router();
const CM = new CartManager();
const PM = new ProductManager();

// Create New Empty Cart
cartsRouter.post('/', async (req, res) => {
    const result = await CM.addCart();
    result['success'] ? res.status(201).send(result) : res.status(400).send({error: "Cart couldn't be created."});
});

// Get Cart By Id
cartsRouter.get('/:cid', async (req, res) => {
    let cartId = req.params.cid;

    const carts = await CM.getCartById(parseInt(cartId));

    carts['error'] ? res.status(400).send(carts) : res.send({carts});
});

// Add Product to Cart
cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    let cartId = req.params.cid;
    let productId = req.params.pid;

    // Validates if Product exists
    const product = await PM.getProductById(parseInt(productId));
    if ( product['error'] ) return res.status(400).send(product);

    const result = await CM.AddProductToCart(parseInt(cartId), parseInt(productId));
    console.log(result)
    result['success'] ? res.status(201).send(result) : res.status(400).send(result);
});

export default cartsRouter;