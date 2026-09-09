import AppLayout from '../../layouts/AppLayout';import CrudPage from '../../components/CrudPage';
export default function Page(){return <AppLayout role="teacher"><CrudPage title="My Classes" resource="classes" columns={[{key:'name',label:'Class'},{key:'section',label:'Section'},{key:'teacher',label:'Teacher'}]} fields={[]}/></AppLayout>}
