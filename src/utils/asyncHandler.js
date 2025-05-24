// when we wrapper around our async fn controller around asyncHandler
// using that req , res , next we are processing the request
// if any error came in async fn then it wont crash the express

//advantage :
// we dont need to use again and again try catch block
// and we can handle error of async fn in one place

/*
    Internal Working: 
        1. .get('/user' , (err, req , res , next)=>{})
        2. so u see second parameter expects function with (err,req,res,next)
        3. so when we wrapped controller (asyncHandler(asyncController))
        4. then it must return fn with req , res , next 
        5. futher express takes that fn and pass req , res , next to asyncHandler
        6. that asyncHandler further passes it to the controllers(async task)

    Ex: 

    const asyncHandler = (requestHandler) => {
        return (req, res, next) => {
            Promise.resolve(requestHandler(req, res, next)).catch((err) => {
                next(err);
            });
        };
    
    const userController = () => {
        // database / async tasks 
    }
    
    app.get('/user' , asyncHandler(userController))

};
    
*/


const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

export { asyncHandler };

/*

    we are calling asyncHandler which takes a function that returns a promise

    app.get('/user' , asyncHandler( async (req , res , next) => {
        // database async fns 
    } ))

*/
