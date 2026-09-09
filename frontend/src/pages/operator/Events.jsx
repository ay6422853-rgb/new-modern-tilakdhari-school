import AppLayout from '../../layouts/AppLayout';import CrudPage from '../../components/CrudPage';
export default function Page(){return <AppLayout role="operator"><CrudPage title="Events" resource="events" columns={[{key:'title',label:'Title'},{key:'date',label:'Date'}]} fields={[{name:'title',label:'Title',required:true},{name:'date',label:'Date',type:'date'}]}/></AppLayout>}
