/*
 * Copyright (c) 2014 airbug Inc. All rights reserved.
 *
 * All software, both binary and source contained in this work is the exclusive property
 * of airbug Inc. Modification, decompilation, disassembly, or any other means of discovering
 * the source code of this software is prohibited. This work is protected under the United
 * States copyright law and other international copyright treaties and conventions.
 */


//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Export('bugaws.AwsUploader')

//@Require('Class')
//@Require('Flows')
//@Require('Obj')
//@Require('bugaws.AwsConfig')
//@Require('bugaws.S3Api')
//@Require('bugaws.S3Bucket')
//@Require('bugfs.BugFs')
//@Require('bugfs.Path')


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('bugpack').context("*", function(bugpack) {

    //-------------------------------------------------------------------------------
    // Common Modules
    //-------------------------------------------------------------------------------

    var AWS                 = require('aws-sdk');


    // -------------------------------------------------------------------------------
    // Bugpack
    // -------------------------------------------------------------------------------

    var Class               = bugpack.require('Class');
    var Flows               = bugpack.require('Flows');
    var Obj                 = bugpack.require('Obj');
    var AwsConfig           = bugpack.require('bugaws.AwsConfig');
    var S3Api               = bugpack.require('bugaws.S3Api');
    var S3Bucket            = bugpack.require('bugaws.S3Bucket');
    var BugFs               = bugpack.require('bugfs.BugFs');
    var Path                = bugpack.require('bugfs.Path');


    //-------------------------------------------------------------------------------
    // Simplify References
    //-------------------------------------------------------------------------------

    var $forEachParallel    = Flows.$forEachParallel;
    var $if                 = Flows.$if;
    var $series             = Flows.$series;
    var $task               = Flows.$task;


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @class
     * @extends {Obj}
     */
    var AwsUploader = Class.extend(Obj, {

        _name: "bugaws.AwsUploader",


        //-------------------------------------------------------------------------------
        // Constructor
        //-------------------------------------------------------------------------------

        /**
         * @constructs
         * @param {string} propertiesFilePath
         */
        _constructor: function(propertiesFilePath) {

            this._super();

            // -------------------------------------------------------------------------------
            // Private Properties
            // -------------------------------------------------------------------------------

            /**
             * @private
             * @type {string}
             */
            this.propertiesFilePath     = propertiesFilePath;

            /**
             * @private
             * @type {{
             *      awsConfig: {
             *          accessKeyId: string,
             *          region: string,
             *          secretAccessKey: string
             *      },
             *      sourcePaths: Array.<string>,
             *      local-bucket: string,
             *      bucket: string,
             *      options: *
             *  }}
             */
            this.props                  = null;
        },


        //-------------------------------------------------------------------------------
        // Getters and Setters
        //-------------------------------------------------------------------------------

        /**
         * @return {string}
         */
        getPropertiesFilePath: function() {
            return this.propertiesFilePath;
        },

        /**
         * @return {{
         *      awsConfig: {
         *          accessKeyId: string,
         *          region: string,
         *          secretAccessKey: string
         *      },
         *      sourcePaths: Array.<string>,
         *      local-bucket: string,
         *      bucket: string,
         *      options: *
         * }}
         */
        getProps: function() {
            return this.props;
        },


        //-------------------------------------------------------------------------------
        // Public Methods
        //-------------------------------------------------------------------------------

        /**
         * @param {function(error)=} callback
         */
        initialize: function(callback) {
            console.log('AwsUploader initializing...');
            var _this = this;
            var propertiesFilePath = this.propertiesFilePath;
            var callback = callback || function() {};

            $series([
                $task(function(flow) {
                    try {
                        _this.props                  = JSON.parse(BugFs.readFileSync(propertiesFilePath));
                    } catch (error) {
                        flow.error(error);
                    } finally {
                        flow.complete();
                    }
                })
            ]).execute(function(error) {
                if (!error) {
                    console.log('AwsUploader successfully initialized');
                } else {
                    console.log('AwsUploader failed to initialize');
                }
                callback(error);
            });
        },

        /**
         * @param {string} outputFilePath
         * @param {string} s3Key
         * @param {string} contentType
         * @param {function(error, S3Object)} callback
         */
        upload: function(outputFilePath, s3Key, contentType, callback) {
            var _this = this;
            var returnedS3Object = null;
            $series([
                $task(function(flow) {
                    _this.s3PutFile(outputFilePath, s3Key, contentType, function(error, s3Object) {
                        returnedS3Object = s3Object;
                        if (!error) {
                            BugFs.deleteFile(outputFilePath, function() {
                                if (!error) {
                                      console.log('File', outputFilePath, 'successfully removed');
                                }
                                flow.complete(error);
                            });
                        } else {
                            flow.error(error);
                        }
                    });
                })
            ]).execute(function(throwable) {
                if (throwable) {
                    callback(throwable, undefined);
                } else {
                    callback(undefined, returnedS3Object);
                }
            });
        },

        /**
         * @param {string} outputDirectoryPath
         * @param {function(error)} callback
         */
        uploadEach: function(outputDirectoryPath, callback) {
            var _this = this;

            $series([
                $task(function(flow) {
                    BugFs.readDirectory(outputDirectoryPath, function(error, files) {
                        if (error) {
                            flow.error(error);
                        } else if (files.length === 0) {
                            console.log("There are no files to upload in", outputDirectoryPath);
                            flow.complete();
                        } else if (files.length > 0) {
                            $forEachParallel(files, function(flow, file) {
                                var outputFilePath = file.givenPath;
                                var filePath = new Path(outputFilePath);
                                _this.upload(outputFilePath, filePath.getName(), null, function(error) {
                                    flow.complete(error);
                                });
                            }).execute(function(error) {
                                if (!error) {
                                    console.log("Successfully uploaded each file in", outputDirectoryPath);
                                }
                                flow.complete(error);
                            });
                        }
                    });
                })
            ]).execute(callback);
        },


        //-------------------------------------------------------------------------------
        // Private Methods
        //-------------------------------------------------------------------------------

         /**
          * @private
          * @param {string} file
          * @param {string} s3Key
          * @param {string} contentType
          * @param {function(Error, S3Object)} callback
          */
         s3PutFile: function(file, s3Key, contentType, callback) {
             var props = this.props;
             var awsConfig = new AwsConfig(props.awsConfig);
             var filePath = new Path(file);
             var s3Bucket = new S3Bucket({
                 name: props.bucket || props["local-bucket"]
             });
             var options = props.options || {acl: ''}; // Test this change
             var s3Api = new S3Api(awsConfig);
             var returnedS3Object = null;

             $if(function(flow) {
                    filePath.exists(function(throwable, exists) {
                        if (!throwable) {
                            flow.assert(exists);
                        } else {
                            flow.error(throwable);
                        }
                    });
                },
                $task(function(flow) {
                    s3Api.putFile(filePath, s3Key, contentType, s3Bucket, options, function(error, s3Object) {
                        returnedS3Object = s3Object;
                        if (!error) {
                            console.log("Successfully uploaded file to S3 '" + s3Api.getObjectURL(s3Object, s3Bucket) + "'");
                            // _this.registerURL(filePath, s3Api.getObjectURL(s3Object, s3Bucket));
                            flow.complete();
                        } else {
                            console.log("s3Api.putFile Error");
                            flow.error(error);
                        }
                    });
                })
            ).$else(
                $task(function(flow) {
                    flow.error(new Error("Cannot find file '" + filePath.getAbsolutePath() + "'"));
                })
            ).execute(function(throwable) {
                 if (throwable) {
                     callback(throwable, undefined);
                 } else {
                     callback(undefined, returnedS3Object);
                 }
            });
        }
    });


    // -------------------------------------------------------------------------------
    // Exports
    // -------------------------------------------------------------------------------

    bugpack.export('bugaws.AwsUploader', AwsUploader);
});
