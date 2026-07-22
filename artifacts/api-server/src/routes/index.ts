import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import textsRouter from "./texts";
import contentTypesRouter from "./contentTypes";
import documentsRouter from "./documents";
import metalanguageTermsRouter from "./metalanguageTerms";
import adminStatusRouter from "./admin/status";
import adminUsersRouter from "./admin/users";
import adminDocumentsRouter from "./admin/documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(textsRouter);
router.use(contentTypesRouter);
router.use(documentsRouter);
router.use(metalanguageTermsRouter);
router.use(adminStatusRouter);
router.use(adminUsersRouter);
router.use(adminDocumentsRouter);

export default router;
