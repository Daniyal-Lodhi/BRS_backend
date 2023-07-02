import conn from '../db.js' ;
import express  from 'express';
import { body ,validationResult } from 'express-validator';
import jwt from 'jsonwebtoken'