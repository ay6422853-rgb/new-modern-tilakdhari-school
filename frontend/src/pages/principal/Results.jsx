import CrudPage from '../../components/CrudPage';
export default function Page(){return <CrudPage title="Results" resource="marks" columns={[{key:'student',label:'Student'},{key:'subject',label:'Subject'},{key:'marks',label:'Marks'}]} fields={[]}/>}
