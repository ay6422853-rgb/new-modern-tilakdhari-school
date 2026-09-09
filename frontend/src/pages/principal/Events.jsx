import CrudPage from '../../components/CrudPage';
export default function Page(){return <CrudPage title="Events" resource="events" columns={[{key:'title',label:'Title'},{key:'date',label:'Date'},{key:'description',label:'Description'}]} fields={[{name:'title',label:'Title',required:true},{name:'date',label:'Date',type:'date'},{name:'description',label:'Description'}]}/>}
