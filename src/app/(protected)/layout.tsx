import HeaderWrapper from '@/app/components/HeaderWrapper';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HeaderWrapper>
            {children}
        </HeaderWrapper>
    );
}