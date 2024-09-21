module.exports = async function(
    req,
    res,
    next
){
    try{
        res.send("Everything is OK on local");
    }catch(error){
        console.error("Error occured on GET/ Status");
    }
}