import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { decrementUserCount } from './metaService';

/**
 * Delete a user from the database and decrement the user count
 * @param userId - The UID of the user to delete
 */
export async function deleteUserAndUpdateCount(userId: string): Promise<void> {
    try {
        // Delete the user document from Firestore
        await deleteDoc(doc(db, 'users', userId));
        console.log(`User ${userId} deleted from database`);
        
        // Decrement the user count in meta collection
        await decrementUserCount();
        console.log('User count decremented after user deletion');
    } catch (error) {
        console.error('Error deleting user and updating count:', error);
        throw error;
    }
}

/**
 * Delete multiple users and update the count accordingly
 * @param userIds - Array of user UIDs to delete
 */
export async function deleteMultipleUsersAndUpdateCount(userIds: string[]): Promise<void> {
    try {
        // Delete all user documents
        for (const userId of userIds) {
            await deleteDoc(doc(db, 'users', userId));
            console.log(`User ${userId} deleted from database`);
        }
        
        // Decrement the user count for each deleted user
        for (let i = 0; i < userIds.length; i++) {
            await decrementUserCount();
        }
        console.log(`User count decremented by ${userIds.length} after batch deletion`);
    } catch (error) {
        console.error('Error deleting multiple users and updating count:', error);
        throw error;
    }
}
