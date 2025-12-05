#!/bin/bash

echo "🔍 Verificando estado de servidores SSH de prueba..."
echo "================================================"

# Lista de servidores a verificar
declare -A servers=(
    ["Ubuntu"]="ubuntu@localhost:2201:ubuntu123"
    ["Alpine"]="alpine@localhost:2203:alpine123" 
    ["DevBox"]="developer@localhost:2205:dev123"
)

for server_name in "${!servers[@]}"; do
    IFS=':' read -r user_host port password <<< "${servers[$server_name]}"
    
    echo -n "🧪 Probando $server_name ($user_host:$port)... "
    
    if timeout 5 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 -p "$port" "$user_host" 'exit 0' 2>/dev/null; then
        echo "✅ LISTO"
    else
        echo "❌ NO LISTO"
    fi
done

echo ""
echo "📋 Para conectar manualmente:"
echo "  ssh ubuntu@localhost -p 2201      (password: ubuntu123)"
echo "  ssh alpine@localhost -p 2203      (password: alpine123)"
echo "  ssh developer@localhost -p 2205   (password: dev123)"
echo ""
echo "🔗 Para usar en SSH Manager:"
echo "  Host: localhost, Puerto: 2201, Usuario: ubuntu, Contraseña: ubuntu123"
echo "  Host: localhost, Puerto: 2203, Usuario: alpine, Contraseña: alpine123"  
echo "  Host: localhost, Puerto: 2205, Usuario: developer, Contraseña: dev123"