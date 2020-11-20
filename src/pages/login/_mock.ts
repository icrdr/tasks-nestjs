import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
const login = async (req: Request, res: Response) => {
  const { password, username } = req.body;
  const payload = {
    id: 1,
    perms: ['common.*'],
  };

  const token = jwt.sign(payload, 'secret', {
    expiresIn: '24h',
  });

  if (password === 'admin' && username === 'admin') {
    res.send({
      token,
    });
  } else if (password === '12345' && username === 'user') {
    res.send({
      token,
    });
  } else {
    res.status(402).send({
      message: 'not aus',
    });
  }
};

export default {
  'POST /api/login': login,
};
