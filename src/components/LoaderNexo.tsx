import { FourSquare } from "react-loading-indicators";

const loader = () => {
    return (
        <FourSquare color={["#3910ea", "#5e3bf2", "#856bf5", "#ac9bf8"]} />
    )
}

const LoaderNexo = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
            {loader()}
            <p className="text-md font-medium text-slate-700">Cargando Datos del Sistema....</p>
        </div>
    );
};

export default LoaderNexo;