// Thin wrapper for backward compatibility
// Delegates to unified batch endpoint with action=report
import { POST as batchPost } from '../batch/route'

export const POST = batchPost