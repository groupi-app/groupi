import { db } from './db';

export async function getPerson(uid:string){
    return await db.person.findUnique({
        where: {
            id: uid
        }
    });
}