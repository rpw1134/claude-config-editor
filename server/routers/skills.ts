import express from 'express'
import type { NextFunction, Request, Response, Router } from 'express'
import { readFileContent } from '../utils/fileIO'
import { resolveHome } from '../utils/parsing'

const router: Router = express.Router()

router.get('/:name', async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  const filePath = resolveHome(`~/.claude/skills/${name}/SKILL.md`)
  try {
    const content = await readFileContent(filePath)
    res.json({ content })
  } catch (err) {
    const error = err as NodeJS.ErrnoException
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Skill not found' })
    }
    next(err)
  }
})

export default router
