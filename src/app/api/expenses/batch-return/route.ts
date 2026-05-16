// Thin wrapper for backward compatibility
// Delegates to unified batch endpoint with action=return
import { POST as batchPost } from '../batch/route'

export const POST = batchPost