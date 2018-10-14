const fetch = require('node-fetch');
const express = require('express');
const date = require('date-and-time');
const router = new express.Router();
const Joi = require('joi');
module.exports.setDb=(database, app)=>{

router.get('/fetchPublicRepos/:username', (req, res, next) => {
    const schema = Joi.object().keys({
        username: Joi.string()
            .min(4)
            .required()
    });

    const result = Joi.validate(req.params, schema, {
        abortEarly: false,
        convert: true
    });

    if (result.error) {
        res.json({
            error: result.error.message,
            code: 'InputValidationError'
        });
        return next();
    }

    const dbo = database.db("ricehome");
    dbo.collection("repos").findOne({username : result.value.username}, (err, dataResponse) => {
        if (err || !dataResponse) {
            fetch(`https://api.github.com/users/${result.value.username}/repos`)
                .then(res => res.json())
                .then(repoResponse => {
                    if(repoResponse && repoResponse.message === 'Not Found'){
                        res.send({
                            success: false, message : repoResponse.message
                        });
                    } else if (repoResponse){
                        const repoDetails = repoResponse.map(individualRepo => {
                            const detailsRepo = {};
                            detailsRepo['repo'] =  individualRepo['name'];
                            detailsRepo['created'] = date.format(new Date(individualRepo['created_at']), 'YYYY/MM/DD HH:mm:ss');
                            detailsRepo['url'] = individualRepo['url'];
                            detailsRepo['rating'] = 0;
                            return detailsRepo;
                        })

                        const userRepoDetails = {
                            username : result.value.username,
                            repoDetails : repoDetails,
                            createdOn : new Date()
                        };
                        
                        dbo.collection("repos").insertOne(userRepoDetails, (err, userDetails) => {
                            if (err) {
                                res.send({ success: false, message: "Internal DB Error." });
                            } else {
                                res.send({success : true, userDetails : userDetails.ops[0]})
                            }
                        });
                    }
                });
        } else {
            res.send({
                success: true, userDetails : dataResponse
            });
        }
    });
});

// POST Call
router.post('/updatePublicRepo', (req, res, next) => {
    const schema = Joi.object().keys({
        username: Joi.string()
            .required(),
        repoDetails: Joi.any()
    });

    const result = Joi.validate(req.body, schema, {
        abortEarly: false,
        convert: true
    });

    if (result.error) {
        res.json({
            error: result.error.message,
            code: 'InputValidationError'
        });
        return next();
    }
    const dbo = database.db("ricehome");
    dbo.collection("repos").findOneAndUpdate({username : result.value.username}, {
        $set : {repoDetails : result.value.repoDetails, updatedOn : new Date()}
    }, {
        returnOriginal : false
    },
    (err, updateResponse) => {
        if (err || !updateResponse) {
            res.send({ success: false, message: "Internal DB Error." });
        } else {
           res.send({success : true, userDetails : updateResponse.value});
        }
    });
});

app.use('/initial', router);

}
