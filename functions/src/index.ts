import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
const firestore = admin.firestore()
const settings = {/* your settings... */ timestampsInSnapshots: true};
  firestore.settings(settings);
const PATH_QUESTIONNAIRES="questionnaires"
const PATH_QUESITONS="questions"
const PATH_DOWNLOADS="download"
const PATH_USERS = "users"



export const download_questionnaire = functions.https.onCall((data, context) => {
    console.log("cuestionario",data.id)
    console.log("actualizar",data.update)
    console.log("usuario",data.id_user)

    //Obtenemos el cuestionario con todas sus preguntas y respuestas.
   return get_questionnaire_complete(data.id,data.id_user,data.update).then(it=>{
        update_download_questionnaire(data.id,data.id_user,data.update)  
        return it
    })
    .catch(e=>{
        return ""
    })
});

function update_download_questionnaire(id:string,id_user:string,update:boolean){
    //Actualizamos las colecciones correspondientes
    const ref_questionnaire = firestore.collection(PATH_QUESTIONNAIRES).doc(id)
    const ref_questionnaire_download = ref_questionnaire.collection(PATH_DOWNLOADS).doc(id_user)
    const ref_user_download = firestore.collection(PATH_USERS).doc(id_user).collection(PATH_DOWNLOADS).doc(id)

   firestore.runTransaction(function(transaction) {
        // This code may get re-run multiple times if there are conflicts.
        return transaction.get(ref_questionnaire).then(function(doc) {
            if (!doc.exists) {
                throw  Error("Cuestionario no existe o ha sido eliminado recientemete!")
            }
            let number_downloads= doc.data().numberDonwloads

            if(!update){
                number_downloads=doc.data().numberDonwloads + 1 
            }
            console.log("numero de descarga",number_downloads)
            //Actualizamos la el numero de descargas que tiene el cuestionario
            transaction.update(ref_questionnaire, { numberDonwloads: number_downloads });
            transaction.set(ref_questionnaire_download,{"date": admin.firestore.FieldValue.serverTimestamp()})
            transaction.set(ref_user_download,{"date": admin.firestore.FieldValue.serverTimestamp()})
        });

    }).then(function() {
        console.log("Transaction successfully committed!");
        return ""
    }).catch(function(error) {
        console.log("Transaction failed: ", error);
        throw Error(error)
    });
}

async function get_questionnaire_complete(id:string, idUser:string,update:boolean) {
   try {
        let mee=false
        const array_questions = [];

        const data_questionnaire=  await firestore.collection(PATH_QUESTIONNAIRES).doc(id).get()
        const questions = await firestore.collection(PATH_QUESTIONNAIRES).doc(id).collection(PATH_QUESITONS).get()
        

        for(const question of questions.docs){
            array_questions.push(question.data())
        }

        if(idUser===data_questionnaire.data().idUser){
            mee=true
        }
        
        const questionnaire={
            idCloud: data_questionnaire.id,
            title: data_questionnaire.data().title,
            idUser: data_questionnaire.data().idUser,
            description: data_questionnaire.data().description,
            numberQuest: data_questionnaire.data().numberQuest,
            me:mee,
            questions:array_questions
        }
    
        return questionnaire
   } catch (error) {
        throw new Error(error);
   }
    
}
