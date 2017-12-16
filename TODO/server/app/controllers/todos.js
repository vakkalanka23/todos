var express = require('express'),
router = express.Router(),
logger = require('../../config/logger'),

mongoose = require('mongoose'),
Todo = mongoose.model('todos'),
passportService = require('../../config/passport'),
passport = require('passport'),
multer = require('multer'),
mkdirp = require('mkdirp');

var requireAuth = passport.authenticate('jwt', { session: false });   

module.exports = function (app, config) {
    app.use('/api', router);
   
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {      
              var path = config.uploads + req.params.userId + "/";
            mkdirp(path, function(err) {
                if(err){
                    res.status(500).json(err);
                } else {
                    cb(null, path);
                }
            });
        },
        filename: function (req, file, cb) {
            let fileName = file.originalname.split('.');   
            cb(null, fileName[0] + new Date().getTime() + "." +	fileName[fileName.length - 1]);
        }
      });
    
    router.get('/todos/user/:userId',  function (req, res, next){
        logger.log('Get ToDos for a user', 'verbose');

       var query = Todo.find({UserId:req.params.todoId})
       .sort(req.query.order)
       .exec()
       .then(result => {
      	if(result && result.length) {
			res.status(200).json(result);
		} else {
			res.status(404).json({message: "No ToDos"});
		}
       })
       .catch(err => {
         return next(err);
       });
   });

    router.get('/todos/:todoId', requireAuth, function (req, res, next){
        logger.log('Get user'+ req.params.todoId, 'verbose');

        Todo.findById(req.params.todoId)
                   .then(Todo => {
                       if(Todo){
                           res.status(200).json(Todo);
                       } else {
                           res.status(404).json({message: "No user found"});
                       }
                   })
                   .catch(error => {
                       return next(error);
                   });
           });   

    router.post('/todos', function(req, res, next){
        logger.log('Create a ToDo', 'verbose');

       var todo = new Todo(req.body);
       todo.save()
       .then(result => {
           res.status(201).json(result);
       })
       .catch( err => {
          return next(err);
       });
     });
  
    router.put('/todos/:todoId', function (req, res, next){
        logger.log('Update Todo with id ToDoid'+ req.params.todoId, 'verbose');

        Todo.findOneAndUpdate({_id: req.params.todoId}, 		
           req.body, {new:true, multi:false})
               .then(Todo => {
                   res.status(200).json(Todo);
               })
               .catch(error => {
                   return next(error);
               });
       });  

    router.delete('/todos/:todoId',   function (req, res, next){
        logger.log('Delete ToDo with id ToDoid'+ req.params.todoId, 'verbose');

        Todo.remove({ _id: req.params.todoId })
               .then(Todo => {
                   res.status(200).json({msg: "ToDo Deleted"});
               })
               .catch(error => {
                   return next(error);
               });
       });


var upload = multer({ storage: storage });

router.post('/todos/upload/:userId/:todoId', upload.any(), function(req, res, next){
    logger.log('Upload file for todo ' + req.params.todoId + ' and ' + req.params.userId, 'verbose');
    
    Todo.findById(req.params.todoId, function(err, todo){
        if(err){ 
            return next(err);
        } else {     
            if(req.files){
                todo.file = {
                    fileName : req.files[0].filename,
                    originalName : req.files[0].originalname,
                    dateUploaded : new Date()
                };
            }           
            todo.save()
                .then(todo => {
                    res.status(200).json(todo);
                })
                .catch(error => {
                    return next(error);
                });
        }
    });
});
 
};