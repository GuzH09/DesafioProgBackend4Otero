import express from 'express';
import handlebars from "express-handlebars";
import { Server } from 'socket.io';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';
import __dirname from './utils.js';
import ProductManager from './ProductManager.js';

const PM = new ProductManager();

const app = express();
const PORT = 8080;
const httpServer = app.listen(PORT, () => {console.log(`Servidor activo en http://localhost:${PORT}`)});
const socketServer = new Server(httpServer);

app.engine("handlebars", handlebars.engine());
app.set("views", `${__dirname}/views`)
app.set("view engine", "handlebars");

app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Vista home.handlebars y realtimeproducts.handlebars
app.use("/", viewsRouter);

app.use("/static", express.static(`${__dirname}/../public`));
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

socketServer.on("connection", socket => {
    console.log("Nuevo cliente conectado -----> ", socket.id);

    socket.on("addProduct", async (data) => {
        // Get Product Data
        let { title, description, code, price, stock, category } = data;
        let thumbnails = [];
        // Status is true by default
        // Thumbnails is not required, [] by default
        const newObjectData = validateNewProduct(
            {title, description, code, price, stock, category, thumbnails}, 
            ['title', 'description', 'code', 'price', 'stock', 'category']
        );
        if ( newObjectData['error'] ) socketServer.emit("refreshProducts", newObjectData);
        const result = await PM.addProduct(newObjectData);
        if ( result['success'] ) {
            const products = await PM.getProducts();
            socketServer.emit("refreshProducts", products)
        } else {
            socketServer.emit("refreshProducts", result)
        }
    });

    socket.on("deleteProduct", async (data) => {
        // Delete Existing Product
        // Get Product Id
        let productId = data;
        const result = await PM.deleteProduct(parseInt(productId));
        if ( result['success'] ) {
            const products = await PM.getProducts();
            socketServer.emit("refreshProducts", products)
        } else {
            socketServer.emit("refreshProducts", result)
        }
    });
});

// Validation Function for New Product
const validateNewProduct = (objectFields, requiredFields) => {
    const newObjectData = {}

    // Validates fields
    for (const field in objectFields) {
        // If field is missing and field is required : Missing Field
        if ( !objectFields[field] && requiredFields.includes(field) ) {
            return {error: `Missing field: ${field} .`};
        }
        // If field is not missing add to new object
        if ( objectFields[field] ) {
            newObjectData[field] = objectFields[field];
        }

        switch ( field ) {
            case "title":
            case "description":
            case "code":
            case "category":
                if ( typeof objectFields[field] !== 'string' ) {
                    return { error: `Invalid type for field: ${field}. Expected: String.` };
                }
                break;
            case "price":
            case "stock":
                // if ( typeof objectFields[field] !== 'number' ) {
                //     return { error: `Invalid type for field: ${field}. Expected: Number.` };
                // }
                break;
            case "thumbnails":
                // It only returns an error if the thumbnail HAS a value, but it is not an array.
                if ( objectFields[field] && !Array.isArray(objectFields[field]) ) {
                    return { error: `Invalid type for field: ${field}. Expected: array of strings.` };
                }
                break;
            default:
                break;
        }
    }

    return newObjectData;
}