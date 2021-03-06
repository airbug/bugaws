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

//@Export('bugaws.EC2IpPermission')

//@Require('Class')
//@Require('Obj')
//@Require('Set')
//@Require('bugaws.AwsObject')
//@Require('bugaws.EC2CidrIpRange')
//@Require('bugaws.EC2UserIdGroupPair')


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('bugpack').context("*", function(bugpack) {

    //-------------------------------------------------------------------------------
    // BugPack
    //-------------------------------------------------------------------------------

    var Class               = bugpack.require('Class');
    var Obj                 = bugpack.require('Obj');
    var Set                 = bugpack.require('Set');
    var AwsObject           = bugpack.require('bugaws.AwsObject');
    var EC2CidrIpRange      = bugpack.require('bugaws.EC2CidrIpRange');
    var EC2UserIdGroupPair  = bugpack.require('bugaws.EC2UserIdGroupPair');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @class
     * @extends {AwsObject}
     */
    var EC2IpPermission = Class.extend(AwsObject, {

        _name: "bugaws.EC2IpPermission",


        //-------------------------------------------------------------------------------
        // Constructor
        //-------------------------------------------------------------------------------

        /**
         * @constructs
         */
        _constructor: function() {

            this._super();


            //-------------------------------------------------------------------------------
            // Private Properties
            //-------------------------------------------------------------------------------

            /**
             * @private
             * @type {?number}
             */
            this.fromPort = undefined;

            /**
             * @private
             * @type {?string}
             */
            this.ipProtocol = undefined;

            /**
             * @private
             * @type {Set.<EC2CidrIpRange>}
             */
            this.ipRanges = new Set();

            /**
             * @private
             * @type {?number}
             */
            this.toPort = undefined;

            /**
             * @private
             * @type {Set.<EC2UserIdGroupPair>}
             */
            this.userIdGroupPairs = new Set();
        },


        //-------------------------------------------------------------------------------
        // Getters and Setters
        //-------------------------------------------------------------------------------

        /**
         * @return {?number}
         */
        getFromPort: function() {
            return this.fromPort;
        },

        /**
         * @return {?string}
         */
        getIpProtocol: function() {
            return this.ipProtocol;
        },

        /**
         * @return {Set.<EC2CidrIpRange>}
         */
        getIpRanges: function() {
            return this.ipRanges;
        },

        /**
         * @return {?number}
         */
        getToPort: function() {
            return this.toPort;
        },

        /**
         * @param {Set.<EC2UserIdGroupPair>}
         */
        getUserIdGroupPairs: function() {
            return this.userIdGroupPairs;
        },


        //-------------------------------------------------------------------------------
        // Object Implementation
        //-------------------------------------------------------------------------------

        /**
         * @param {*} value
         * @return {boolean}
         */
        equals: function(value) {
            if (Class.doesExtend(value, EC2IpPermission)) {
                return (
                    value.getFromPort() === this.getFromPort() &&
                    value.getIpProtocol() === this.getIpProtocol() &&
                    value.getToPort() === this.getToPort() &&

                    //NOTE BRN: These lists are immutable in this Class, so it is safe to use these values in the equals method

                    value.getIpRanges().containsEqual(this.getIpRanges()) &&
                    value.getUserIdGroupPairs().containsEqual(this.getUserIdGroupPairs())
                );
            }
            return false;
        },

        /**
         * @return {number}
         */
        hashCode: function() {
            if (!this._hashCode) {
                this._hashCode = Obj.hashCode("[EC2IpPermission]" + Obj.hashCode());
            }
            return this._hashCode;
        },


        //-------------------------------------------------------------------------------
        // Protected Class Methods
        //-------------------------------------------------------------------------------

        /**
         * @protected
         * @param  {{
         *  fromPort: ?number,
         *  ipProtocol: ?string,
         *  toPort: ?number
         * }} jsonObject
         */
        jsonCreate: function(jsonObject) {
            var _this = this;
            this.fromPort = jsonObject.fromPort;
            this.ipProtocol = jsonObject.ipProtocol;
            this.toPort = jsonObject.toPort;
            if (jsonObject.ipRanges) {
                jsonObject.ipRanges.forEach(function(cidrIpRange) {
                    var ec2CidrIpRange = new EC2CidrIpRange();
                    ec2CidrIpRange.jsonCreate(cidrIpRange);
                    _this.ipRanges.add(ec2CidrIpRange);
                });
            }
            if (jsonObject.userIdGroupPairs) {
                jsonObject.userIdGroupPairs.forEach(function(userIdGroupPair) {
                    var ec2UserIdGroupPair = new EC2UserIdGroupPair();
                    ec2UserIdGroupPair.jsonCreate(userIdGroupPair);
                    _this.userIdGroupPairs.add(ec2UserIdGroupPair);
                });
            }
        },

        /**
         * @protected
         * @param {{
         *  FromPort: ?number,
         *  IpProtocol: ?string,
         *  ToPort: ?number
         * }} awsObject
         */
        syncCreate: function(awsObject) {
            var _this = this;
            this.fromPort = awsObject.FromPort;
            this.ipProtocol = awsObject.IpProtocol;
            this.toPort = awsObject.ToPort;
            awsObject.IpRanges.forEach(function(cidrIpRange) {
                var ec2CidrIpRange = new EC2CidrIpRange();
                ec2CidrIpRange.syncCreate(cidrIpRange);
                _this.ipRanges.add(ec2CidrIpRange);
            });
            awsObject.UserIdGroupPairs.forEach(function(userIdGroupPair) {
                var ec2UserIdGroupPair = new EC2UserIdGroupPair();
                ec2UserIdGroupPair.syncCreate(userIdGroupPair);
                _this.userIdGroupPairs.add(ec2UserIdGroupPair);
            });
        }
    });


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    bugpack.export('bugaws.EC2IpPermission', EC2IpPermission);
});
