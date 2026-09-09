import AppLayout from '../../layouts/AppLayout';import CrudPage from '../../components/CrudPage';
export default function Page(){return <AppLayout role="accountant"><CrudPage title="Cash Book" resource="payments" columns={[{key:'receiptNo',label:'Receipt'},{key:'type',label:'Type'},{key:'amount',label:'Amount'},{key:'method',label:'Method'}]} fields={[]}/></AppLayout>}
