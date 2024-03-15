import { Router } from "express";
import ProductManager from '../ProductManager.js';
import { uploader } from "../utils.js";

const productsRouter = Router();
const PM = new ProductManager();

// Get All Products - Get All Products With Limit
productsRouter.get('/', async (req, res) => {
    let {limit} = req.query;
    let products = await PM.getProducts();
    if (limit) {
        products = products.slice(0, parseInt(limit));
    }
    res.send({products});
});

// Get Product By Id
productsRouter.get('/:pid', async (req, res) => {
    let productId = req.params.pid;
    const products = await PM.getProductById(parseInt(productId));
    products['error'] ? res.status(400).send(products) : res.send({products});
});

// Create New Product
productsRouter.post('/', uploader.array('thumbnails'), async (req, res) => {
    if (!req.files) {
        return res.status(400).send({error: "Error uploading image."})
    }

    const thumbnails = req.files.map(file => file.path);

    // Get Product Data from Body
    let { title, description, code, price, stock, category } = req.body;

    // Status is true by default
    // Thumbnails is not required, [] by default
    const newObjectData = validateNewProduct(
        {title, description, code, price, stock, category, thumbnails}, 
        ['title', 'description', 'code', 'price', 'stock', 'category']
    );
    if ( newObjectData['error'] ) return res.status(400).send(newObjectData);
    const result = await PM.addProduct(newObjectData);
    result['success'] ? res.status(201).send(result) : res.status(400).send(result);
});

// Update Existing Product
productsRouter.put('/:pid', async (req, res) => {
    // Get Product Data from Body
    let { title, description, code, price, stock, category, thumbnails } = req.body;
    // Get Product Id from Params
    let productId = req.params.pid;

    const newObjectData = validateUpdateProduct( {title, description, code, price, stock, category, thumbnails} );
    if ( newObjectData['error'] ) return res.status(400).send(newObjectData);
    const result = await PM.updateProduct( parseInt(productId), newObjectData );
    result['success'] ? res.status(201).send(result) : res.status(400).send(result);
});

// Delete Existing Product
productsRouter.delete('/:pid', async (req, res) => {
    // Get Product Id from Params
    let productId = req.params.pid;
    const result = await PM.deleteProduct(parseInt(productId));
    result['success'] ? res.status(201).send(result) : res.status(400).send(result);
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

// Validation Function for Updating Product
const validateUpdateProduct = (objectFields) => {
    const newObjectData = {}

    // Validates new Fields
    for (const field in objectFields) {
        // If field is not undefined, push the field into the new object
        if ( objectFields[field] ) {
            newObjectData[field] = objectFields[field];
        }

        switch ( field ) {
            case "title":
            case "description":
            case "code":
            case "category":
                // It only returns an error if the title-description-code-category HAS a value, but it is not a string.
                if ( objectFields[field] && typeof objectFields[field] !== 'string' ) {
                    return { error: `Invalid type for field: ${field}. Expected: String.` };
                }
                break;
            case "price":
            case "stock":
                // It only returns an error if the stock or price HAS a value, but it is not a number.
                if ( objectFields[field] && typeof objectFields[field] !== 'number' ) {
                    return { error: `Invalid type for field: ${field}. Expected: Number.` };
                }
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

export default productsRouter;